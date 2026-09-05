"use client";

import { useState } from "react";
import Link from "next/link";
import { Keyboard, Mic } from "lucide-react";
import { PassportGuide, type GuideMode, type GuideStorage } from "@/components/agent/passport-guide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = { userId: string | null; fullName: string; siteUrl: string };

/**
 * Picks who is talking (name, when there is no account yet) and how
 * (voice or text), then hands off to the guide.
 */
export function OnboardingClient({ userId, fullName: knownName, siteUrl }: Props) {
  const storage: GuideStorage = userId ? "supabase" : "local";
  const [name, setName] = useState(knownName);
  const [draftName, setDraftName] = useState("");
  const [mode, setMode] = useState<GuideMode | null>(null);
  const first = name.split(" ")[0] || "there";

  if (!name) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (draftName.trim()) setName(draftName.trim());
        }}
        className="flex max-w-md flex-col gap-4"
      >
        <h1 className="text-3xl font-bold">Welcome</h1>
        <label htmlFor="first-name" className="text-base font-bold">
          What should the guide call you?
        </label>
        <Input id="first-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoComplete="given-name" />
        <Button type="submit" size="lg" disabled={!draftName.trim()}>
          Continue
        </Button>
      </form>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Welcome, {first}</h1>
        <p>
          Your Passport Guide will ask a few easy questions and build your Ability Passport as you go. How would you
          like to talk?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("voice")}
            className="flex flex-col items-center gap-3 rounded-xl border-2 p-8 text-lg font-bold hover:border-green hover:bg-green-soft"
          >
            <Mic aria-hidden="true" className="size-10 text-green" />
            Talk out loud
          </button>
          <button
            type="button"
            onClick={() => setMode("text")}
            className="flex flex-col items-center gap-3 rounded-xl border-2 p-8 text-lg font-bold hover:border-green hover:bg-green-soft"
          >
            <Keyboard aria-hidden="true" className="size-10 text-green" />
            Type instead
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Prefer a form?{" "}
          <Link href="/app/profile" className="font-bold text-green underline">
            Fill in your profile by hand
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Let&apos;s build your Passport</h1>
      <PassportGuide userId={userId ?? "local-user"} fullName={name} siteUrl={siteUrl} mode={mode} storage={storage} />
      <button type="button" onClick={() => setMode(null)} className="self-start text-sm font-bold text-green underline">
        Change how we talk
      </button>
    </div>
  );
}
