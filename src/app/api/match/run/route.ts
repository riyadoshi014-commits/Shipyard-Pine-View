import { NextResponse } from "next/server";
import { runMatching } from "@/lib/match/run";
import { createClient } from "@/lib/supabase/server";

/** POST: recompute matches for the signed-in user's side of the table. */
export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({ ok: false, error: "Please log in first." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  try {
    let count = 0;
    if (profile?.role === "employee") {
      count = await runMatching({ employeeId: userId });
    } else if (profile?.role === "employer") {
      const { data: jobs } = await supabase.from("jobs").select("id").eq("employer_id", userId);
      count = await runMatching({ jobIds: (jobs ?? []).map((j) => j.id as string) });
    }
    return NextResponse.json({ ok: true, data: { count } });
  } catch {
    return NextResponse.json({ ok: false, error: "Matching failed. Try again in a moment." }, { status: 500 });
  }
}
