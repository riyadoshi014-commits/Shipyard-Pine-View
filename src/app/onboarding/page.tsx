import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasAnthropicEnv, hasElevenLabsEnv, hasSupabaseEnv } from "@/lib/env";
import { SITE_URL } from "@/lib/sample";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./onboarding-client";
import { OnboardingDemo } from "./onboarding-demo";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  let userId: string | null = null;
  let fullName = "";

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) {
      userId = data.claims.sub;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle();
      fullName = profile?.full_name ?? "";
    }
  }

  return (
    <div className="ap-site flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="flex items-center gap-2">
            <span className="ap-logo-mark" aria-hidden="true">
              C
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-green">ConnectAble</span>
          </span>
          <Button variant="ghost" className="rounded-full" render={<Link href="/app" />}>
            Skip for now
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {hasAnthropicEnv() ? (
          <OnboardingClient userId={userId} fullName={fullName} siteUrl={SITE_URL} voiceAvailable={hasElevenLabsEnv()} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <OnboardingDemo />
          </div>
        )}
      </main>
    </div>
  );
}
