import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingDemo } from "./onboarding-demo";

export const metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return (
    <>
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <span className="text-2xl font-bold text-green">ConnectAble</span>
          <Button variant="ghost" render={<Link href="/app" />}>
            Skip for now
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <OnboardingDemo />
      </main>
    </>
  );
}
