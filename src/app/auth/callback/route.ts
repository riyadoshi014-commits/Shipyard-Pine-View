import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PKCE code exchange. Used when the confirmation email carries Supabase's
 * default {{ .ConfirmationURL }} (which redirects here with ?code=...), or
 * after OAuth. Sign-up should pass emailRedirectTo = /auth/callback?next=...
 *
 * Caveat: the PKCE verifier lives in the browser that started sign-up, so a
 * link opened elsewhere fails. The /auth/confirm route (token_hash) has no
 * such limit; prefer it if the project allows a custom email template.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
    );
  }

  return NextResponse.redirect(new URL("/login?error=missing-code", origin));
}
