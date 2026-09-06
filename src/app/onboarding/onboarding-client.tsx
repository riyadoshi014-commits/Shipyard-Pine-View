"use client";

import { useState } from "react";
import Link from "next/link";
import { Keyboard, Mic } from "lucide-react";
import { PassportGuide, type GuideStorage } from "@/components/agent/passport-guide";
import { TextOnboarding } from "@/components/agent/text-onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GuideMode = "voice" | "text";
type Props = { userId: string | null; fullName: string; siteUrl: string; voiceAvailable: boolean };

/**
 * Picks who is talking (name, when there is no account yet) and how
 * (voice or text), then hands off to the guide.
 */
export function OnboardingClient({ userId, fullName: knownName, siteUrl, voiceAvailable }: Props) {
  const storage: GuideStorage = userId ? "supabase" : "local";
  const [name, setName] = useState(knownName);
  const [draftName, setDraftName] = useState("");
  // When voice isn't configured, there's only one real choice -- don't make
  // someone click through a chooser to discover the other option is
  // disabled. Skip straight to text. If voice is ever configured, this
  // still shows the real chooser so people can pick either.
  const [mode, setMode] = useState<GuideMode | null>(voiceAvailable ? null : "text");
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
        <p className="ap-label">Passport guide</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome</h1>
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
        <p className="ap-label">Passport guide</p>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {first}</h1>
        <p>
          Your Passport Guide will ask a few easy questions and build your Ability Passport as you go. How would you
          like to talk?
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => voiceAvailable && setMode("voice")}
            disabled={!voiceAvailable}
            aria-disabled={!voiceAvailable}
            className="flex flex-col items-center gap-3 rounded-xl border-2 p-8 text-lg font-bold hover:border-green hover:bg-green-soft disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-inherit disabled:hover:bg-transparent"
          >
            <Mic aria-hidden="true" className="size-10 text-green" />
            Talk out loud
            {!voiceAvailable && <span className="text-sm font-normal text-muted-foreground">Not set up yet -- try typing instead.</span>}
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
      <p className="ap-label">Passport guide</p>
      <h1 className="text-3xl font-extrabold tracking-tight">Let&apos;s build your Passport</h1>
      {mode === "voice" ? (
        <PassportGuide userId={userId ?? "local-user"} fullName={name} siteUrl={siteUrl} mode="voice" storage={storage} />
      ) : (
        <TextOnboarding userId={userId ?? "local-user"} fullName={name} siteUrl={siteUrl} storage={storage} />
      )}
      {/* Only offer to change modes when there's a real second mode to switch
          to -- with voice unavailable, "changing" would just restart the
          same text conversation and lose whatever was already typed. */}
      {voiceAvailable && (
        <button type="button" onClick={() => setMode(null)} className="self-start text-sm font-bold text-green underline">
          Change how we talk
        </button>
      )}
    </div>
  );
}
