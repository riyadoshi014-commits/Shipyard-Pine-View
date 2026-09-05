import Link from "next/link";
import { Button } from "@/components/ui/button";
import { hasElevenLabsEnv, hasSupabaseEnv } from "@/lib/env";
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
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-2xl font-bold text-green">ConnectAble</span>
          <Button variant="ghost" render={<Link href="/app" />}>
            Skip for now
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {hasElevenLabsEnv() ? (
          <OnboardingClient userId={userId} fullName={fullName} siteUrl={SITE_URL} />
        ) : (
          <div className="mx-auto max-w-3xl">
            <OnboardingDemo />
          </div>
        )}
      </main>
    </>
  );
}
