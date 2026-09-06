import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/data/profile";
import { parseJobTasksFromDescription } from "@/lib/job-task-parse";

/**
 * Employer-only. Parses a freeform job description into suggested title/
 * abilities/accommodations and returns them -- saves nothing itself. The
 * caller (JobDescriptionAssist) shows the suggestions and lets the employer
 * accept, edit, or ignore each one; the real job-posting form is still what
 * submits and saves, same rule as /api/resume/parse and /api/profile/translate.
 */
export async function POST(req: NextRequest) {
  await requireRole("employer");

  const body = await req.json().catch(() => null);
  if (typeof body?.description !== "string" || body.description.trim().length === 0) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  try {
    const parsed = await parseJobTasksFromDescription(body.description);
    return NextResponse.json({ parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Job parsing failed" },
      { status: 502 }
    );
  }
}
