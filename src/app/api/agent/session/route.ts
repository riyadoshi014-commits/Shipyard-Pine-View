import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeStatus } from "@/lib/agent/profile-status";
import { firstName } from "@/lib/agent/text";
import type { EmployeePrivate, EmployeeProfile } from "@/lib/domain";

/**
 * POST /api/agent/session  { persona?: "employee" | "employer" }
 *
 * Verifies the Supabase session, mints a short-lived ElevenLabs signed URL
 * for the private agent, and returns the dynamic variables the agent prompt
 * expects. The API key never leaves the server.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims) {
    return NextResponse.json(
      { ok: false, error: "Please log in first." },
      { status: 401 },
    );
  }
  const userId = claimsData.claims.sub;

  const body = (await request.json().catch(() => ({}))) as { persona?: string };
  const persona = body.persona === "employer" ? "employer" : "employee";
  const agentId =
    persona === "employer"
      ? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_EMPLOYER
      : process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_EMPLOYEE;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { ok: false, error: "The guide is not set up yet." },
      { status: 503 },
    );
  }

  const [{ data: profile }, { data: employee }, { data: priv }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", userId).maybeSingle(),
    supabase
      .from("employee_profiles")
      .select(
        "headline, city, about, abilities, accommodations, availability, awards, education, volunteer",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("employee_private")
      .select("salary_min")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const signed = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey }, cache: "no-store" },
  );
  if (!signed.ok) {
    return NextResponse.json(
      { ok: false, error: "The guide could not be reached. Try again in a moment." },
      { status: 502 },
    );
  }
  const { signed_url } = (await signed.json()) as { signed_url: string };

  return NextResponse.json({
    ok: true,
    data: {
      signedUrl: signed_url,
      persona,
      fullName: profile?.full_name ?? "",
      dynamicVariables: {
        user_first_name: firstName(profile?.full_name),
        user_role: profile?.role ?? persona,
        profile_status: summarizeStatus(
          (employee as Partial<EmployeeProfile> | null) ?? null,
          (priv as Partial<EmployeePrivate> | null) ?? null,
        ),
      },
    },
  });
}
