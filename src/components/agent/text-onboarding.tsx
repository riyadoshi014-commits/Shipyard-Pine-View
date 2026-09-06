"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { PassportCard } from "@/components/passport/passport-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPassportClientTools } from "@/lib/agent/client-tools";
import { createLocalStore } from "@/lib/agent/local-store";
import { summarizeStatus } from "@/lib/agent/profile-status";
import { firstName } from "@/lib/agent/text";
import { hasDraftConsent } from "@/lib/consent";
import type { EmployeePrivate, EmployeeProfile } from "@/lib/domain";
import type { SampleEmployee } from "@/lib/sample";
import { createClient } from "@/lib/supabase/client";
import { Transcript, type TranscriptLine } from "./transcript";

export type GuideStorage = "supabase" | "local";

/**
 * The typed conversation is kept on-device (consent-gated) so closing the
 * tab mid-onboarding doesn't lose the thread. The Passport answers
 * themselves are already saved by the tools as they go; this only restores
 * the chat so the person can pick up where they left off.
 */
const CHAT_DRAFT_KEY = "connectable.draft.onboarding-chat";
type ChatDraft = { messages: Anthropic.MessageParam[]; lines: TranscriptLine[]; started: boolean };

type Props = { userId: string; fullName: string; siteUrl: string; storage: GuideStorage };
type Snapshot = { profile: Partial<EmployeeProfile> | null; priv: Partial<EmployeePrivate> | null };

const PROFILE_COLUMNS =
  "user_id, headline, about, about_raw, city, state, remote_preference, availability, abilities, accommodations, awards, education, volunteer, passport_slug, passport_public, searchable";

async function loadSnapshot(client: SupabaseClient, userId: string): Promise<Snapshot> {
  const [{ data: profile }, { data: priv }] = await Promise.all([
    client.from("employee_profiles").select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    client.from("employee_private").select("salary_min, salary_max").eq("user_id", userId).maybeSingle(),
  ]);
  return { profile: (profile as Partial<EmployeeProfile> | null) ?? null, priv: (priv as Partial<EmployeePrivate> | null) ?? null };
}

function toCard(profile: Partial<EmployeeProfile>, fullName: string): SampleEmployee {
  return {
    id: "preview",
    slug: profile.passport_slug ?? "",
    fullName,
    headline: profile.headline ?? "",
    about: profile.about ?? "",
    aboutRaw: profile.about_raw ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    remotePreference: profile.remote_preference ?? "either",
    abilities: profile.abilities ?? [],
    accommodations: profile.accommodations ?? [],
    availability: profile.availability ?? [],
    awards: profile.awards ?? [],
    education: profile.education ?? [],
    volunteer: profile.volunteer ?? [],
    salaryMin: null,
    salaryMax: null,
  };
}

/**
 * The "Type instead" onboarding path, running entirely on Claude --
 * independent of ElevenLabs. Reuses the exact same buildPassportClientTools
 * functions the voice/ElevenLabs path uses, so a save here and a save
 * there behave identically and neither duplicates the other's logic. See
 * src/app/api/agent/text-turn/route.ts for why this needs only
 * ANTHROPIC_API_KEY.
 */
export function TextOnboarding({ userId, fullName, siteUrl, storage }: Props) {
  const client = useMemo(() => (storage === "supabase" ? createClient() : createLocalStore().client), [storage]);
  const [snapshot, setSnapshot] = useState<Snapshot>({ profile: null, priv: null });
  const [messages, setMessages] = useState<Anthropic.MessageParam[]>([]);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSnapshot(await loadSnapshot(client, userId));
  }, [client, userId]);

  useEffect(() => {
    let active = true;
    loadSnapshot(client, userId).then((s) => {
      if (active) setSnapshot(s);
    });
    return () => {
      active = false;
    };
  }, [client, userId]);

  // Restore an interrupted conversation once, on mount.
  useEffect(() => {
    if (!hasDraftConsent()) return;
    try {
      const raw = window.localStorage.getItem(CHAT_DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as ChatDraft;
      if (saved.started && Array.isArray(saved.messages) && saved.messages.length > 0) {
        setMessages(saved.messages);
        setLines(Array.isArray(saved.lines) ? saved.lines : []);
        setStarted(true);
        toast("We brought back your conversation.", {
          action: {
            label: "Start over",
            onClick: () => {
              try {
                window.localStorage.removeItem(CHAT_DRAFT_KEY);
              } catch {
                /* ignore */
              }
              window.location.reload();
            },
          },
        });
      }
    } catch {
      /* corrupt or unavailable storage -- start fresh */
    }
  }, []);

  // Keep the on-device copy current while the conversation is live.
  useEffect(() => {
    if (!hasDraftConsent() || !started) return;
    try {
      window.localStorage.setItem(CHAT_DRAFT_KEY, JSON.stringify({ messages, lines, started } satisfies ChatDraft));
    } catch {
      /* private mode / quota -- keep going in memory */
    }
  }, [messages, lines, started]);

  // Once the Passport is published, the conversation is done -- drop the draft.
  useEffect(() => {
    if (!publishedUrl) return;
    try {
      window.localStorage.removeItem(CHAT_DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [publishedUrl]);

  const tools = useMemo(() => buildPassportClientTools(client, userId, { siteUrl, fullName }), [client, userId, siteUrl, fullName]);

  const addLine = useCallback((who: TranscriptLine["who"], text: string) => {
    if (!text) return;
    setLines((l) => [...l, { id: crypto.randomUUID(), who, text }]);
  }, []);

  /** Sends the current message history to Claude, executes any tool calls
   *  via the same functions the ElevenLabs path uses, and loops until the
   *  model produces a turn with no tool calls (i.e. it's waiting on the
   *  person, not on a tool result). */
  const runTurn = useCallback(
    async (history: Anthropic.MessageParam[]) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/agent/text-turn", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history,
            userFirstName: firstName(fullName),
            profileStatus: summarizeStatus(snapshot.profile, snapshot.priv),
          }),
        });
        const json = (await res.json()) as { content?: Anthropic.ContentBlock[]; error?: string };
        if (!res.ok || !json.content) {
          setError(json.error ?? "The guide is not available right now.");
          return;
        }

        for (const block of json.content) {
          if (block.type === "text" && block.text.trim()) addLine("guide", block.text.trim());
        }

        const toolUseBlocks = json.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
        const nextHistory: Anthropic.MessageParam[] = [...history, { role: "assistant", content: json.content }];

        if (toolUseBlocks.length === 0) {
          setMessages(nextHistory);
          return;
        }

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of toolUseBlocks) {
          const fn = tools[block.name];
          const reply = fn ? await fn(block.input as Record<string, unknown>) : `Error: unknown tool ${block.name}.`;
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: reply });
          if (block.name === "finish_onboarding") {
            const url = reply.match(/https?:\/\/\S+/)?.[0];
            if (url) setPublishedUrl(url);
          }
        }
        await refresh();

        const withResults: Anthropic.MessageParam[] = [...nextHistory, { role: "user", content: toolResults }];
        setMessages(withResults);
        // The model needs to see the tool results before it can ask the
        // next question -- continue the loop automatically rather than
        // waiting on the person for a turn they didn't need to take.
        await runTurn(withResults);
      } catch {
        setError("We couldn't reach the guide. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [addLine, fullName, refresh, snapshot.priv, snapshot.profile, tools]
  );

  function start() {
    setStarted(true);
    const initial: Anthropic.MessageParam[] = [{ role: "user", content: "Hi, I'm ready to start." }];
    setMessages(initial);
    void runTurn(initial);
  }

  function send() {
    const text = draft.trim();
    if (!text || busy) return;
    addLine("you", text);
    setDraft("");
    const next: Anthropic.MessageParam[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    void runTurn(next);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="status" className="rounded-full bg-muted px-3 py-1 text-sm font-bold">
            {!started ? "Not started" : busy ? "Guide is thinking…" : "Connected"}
          </p>
          {!started && (
            <Button type="button" size="lg" onClick={start}>
              Start typing
            </Button>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-coral-soft p-3 font-bold text-coral-foreground">
            {error}
          </p>
        )}

        <div className="min-h-64 rounded-lg border p-4">
          <Transcript lines={lines} />
        </div>

        {started && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <label htmlFor="text-guide-input" className="sr-only">
              Your message
            </label>
            <Input id="text-guide-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type here" disabled={busy} />
            <Button type="submit" aria-label="Send" disabled={busy || !draft.trim()}>
              <Send aria-hidden="true" />
            </Button>
          </form>
        )}

        {publishedUrl && (
          <div className="rounded-lg border-2 border-green bg-green-soft p-4">
            <p className="font-bold">Your Ability Passport is live.</p>
            <p className="mt-1 text-sm break-all">{publishedUrl}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button render={<Link href="/app/passport" />}>See my Passport and QR code</Button>
              <Button variant="outline" render={<Link href="/app/profile" />}>
                Check what was saved
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside aria-label="Your Passport so far" className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-muted-foreground">Your Passport, filling in live</h2>
        {snapshot.profile ? (
          <>
            <PassportCard person={toCard(snapshot.profile, fullName)} />
            {(snapshot.profile.accommodations?.length ?? 0) > 0 && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="mb-1 font-bold">Accommodations (shown to matched employers only)</p>
                <p>{snapshot.profile.accommodations?.join(", ")}</p>
              </div>
            )}
            {snapshot.priv?.salary_min != null && (
              <p className="text-sm text-muted-foreground">
                Pay range saved privately: ${snapshot.priv.salary_min}–${snapshot.priv.salary_max} / hour
              </p>
            )}
          </>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Nothing saved yet. Each answer shows up here as the guide saves it.
          </p>
        )}
      </aside>
    </div>
  );
}
