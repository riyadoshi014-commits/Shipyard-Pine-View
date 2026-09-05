import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Target of the confirmation email link. Supabase's default template links to
 * {{ .SiteURL }}/auth/confirm?token_hash=...&type=email — set that template
 * in the dashboard (Auth → Email Templates → Confirm signup).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?error=missing-token");
}
