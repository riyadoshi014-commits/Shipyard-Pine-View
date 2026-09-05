import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseResumeFromPdfBase64, parseResumeFromText } from "@/lib/resume-parse";

/**
 * Parses a resume and returns suggested profile fields. Does not save
 * anything -- the caller shows the person what was found and lets them
 * accept, edit, or reject it (same rule the Passport Guide agent already
 * follows for about_raw/about).
 *
 * Body: either { text: string } for a plain-text/.docx-extracted resume, or
 * { pdfBase64: string } for a PDF sent straight through.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.text && !body?.pdfBase64) {
    return NextResponse.json({ error: "text or pdfBase64 is required" }, { status: 400 });
  }

  try {
    const parsed = body.pdfBase64
      ? await parseResumeFromPdfBase64(body.pdfBase64)
      : await parseResumeFromText(body.text);
    return NextResponse.json({ parsed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Resume parsing failed" },
      { status: 502 }
    );
  }
}
