import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestFollowUps } from "@/lib/interview-copilot";

/**
 * Employer-side only. jobs RLS lets any authenticated user read an OPEN job
 * (see supabase/migrations/20260905192406_init.sql), which is broader than
 * "only this job's employer" -- so this route checks employer_id === the
 * caller explicitly rather than relying on RLS alone for that boundary.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.jobId) return NextResponse.json({ error: "jobId is required" }, { status: 400 });

  const { data: job, error } = await supabase.from("jobs").select("*").eq("id", body.jobId).single();
  if (error || !job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (job.employer_id !== user.id) {
    return NextResponse.json({ error: "This job belongs to a different employer" }, { status: 403 });
  }

  try {
    const suggestion = await suggestFollowUps(job, body.transcriptSoFar ?? "");
    return NextResponse.json(suggestion);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Copilot request failed" },
      { status: 502 }
    );
  }
}
