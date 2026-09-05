import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { translateToProfessional } from "@/lib/translate-profile";

/**
 * Always returns both the original text and the rewrite -- never one alone.
 * The person chooses which is kept; this route makes the choice possible,
 * it does not make it. Nothing is saved here -- see AboutTranslator, which
 * only writes to the profile through the existing employee_profiles save
 * path once the person accepts.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.raw !== "string" || body.raw.trim().length === 0) {
    return NextResponse.json({ error: "raw is required" }, { status: 400 });
  }

  try {
    const result = await translateToProfessional(body.raw);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not rewrite that text" },
      { status: 502 }
    );
  }
}
