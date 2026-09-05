"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Mic, MicOff, PhoneOff, Send } from "lucide-react";
import { PassportCard } from "@/components/passport/passport-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildPassportClientTools } from "@/lib/agent/client-tools";
import { createLocalStore } from "@/lib/agent/local-store";
import { summarizeStatus } from "@/lib/agent/profile-status";
import { firstName } from "@/lib/agent/text";
import type { EmployeePrivate, EmployeeProfile } from "@/lib/domain";
import type { SampleEmployee } from "@/lib/sample";
import { createClient } from "@/lib/supabase/client";
import { Transcript, type TranscriptLine } from "./transcript";

export type GuideMode = "voice" | "text";
export type GuideStorage = "supabase" | "local";

type Props = {
  userId: string;
  fullName: string;
  siteUrl: string;
  mode: GuideMode;
  storage: GuideStorage;
};

type Snapshot = { profile: Partial<EmployeeProfile> | null; priv: Partial<EmployeePrivate> | null };

const PROFILE_COLUMNS =
  "user_id, headline, about, about_raw, city, state, remote_preference, availability, abilities, accommodations, awards, education, volunteer, passport_slug, passport_public, searchable";

async function loadSnapshot(client: SupabaseClient, userId: string): Promise<Snapshot> {
  const [{ data: profile }, { data: priv }] = await Promise.all([
    client.from("employee_profiles").select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    client.from("employee_private").select("salary_min, salary_max").eq("user_id", userId).maybeSingle(),
  ]);
  return {
    profile: (profile as Partial<EmployeeProfile> | null) ?? null,
    priv: (priv as Partial<EmployeePrivate> | null) ?? null,
  };
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
 * The Passport Guide conversation. Client tools run in the browser: with
 * Supabase they write through the user's own session (RLS applies); without
 * it they write to a browser-local store so the guide is demoable anywhere.
 */
export function PassportGuide({ userId, fullName, siteUrl, mode, storage }: Props) {
  const client = useMemo(
    () => (storage === "supabase" ? createClient() : createLocalStore().client),
    [storage],
  );
  const [snapshot, setSnapshot] = useState<Snapshot>({ profile: null, priv: null });
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

  const tools = useMemo(() => {
    const base = buildPassportClientTools(client, userId, { siteUrl, fullName });
    const wrapped: typeof base = {};
    for (const [name, fn] of Object.entries(base)) {
      wrapped[name] = async (parameters: Record<string, unknown>) => {
        const reply = await fn(parameters);
        await refresh();
        if (name === "finish_onboarding") {
          const url = reply.match(/https?:\/\/\S+/)?.[0];
          if (url) setPublishedUrl(url);
        }
        return reply;
      };
    }
    return wrapped;
  }, [client, userId, siteUrl, fullName, refresh]);

  const dynamicVariables = useMemo(
    () => ({
      user_first_name: firstName(fullName),
      user_role: "employee",
      profile_status: summarizeStatus(snapshot.profile, snapshot.priv),
    }),
    [fullName, snapshot],
  );

  return (
    <ConversationProvider clientTools={tools} textOnly={mode === "text"}>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <GuideSession mode={mode} publishedUrl={publishedUrl} startVariables={dynamicVariables} />
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
    </ConversationProvider>
  );
}

function GuideSession({
  mode,
  publishedUrl,
  startVariables,
}: {
  mode: GuideMode;
  publishedUrl: string | null;
  startVariables: Record<string, string>;
}) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  // Text mode streams replies in parts; voice mode delivers whole messages.
  const streamed = useRef("");
  const lastStreamed = useRef("");

  const addGuideLine = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setLines((l) => [...l, { id: crypto.randomUUID(), who: "guide", text: clean }]);
  };

  const conversation = useConversation({
    onAgentChatResponsePart: (part) => {
      if (part.type === "start") streamed.current = "";
      if (part.type === "delta") streamed.current += part.text ?? "";
      if (part.type === "stop") {
        lastStreamed.current = streamed.current.trim();
        addGuideLine(streamed.current);
        streamed.current = "";
      }
    },
    onMessage: ({ message, role }) => {
      if (role === "user") {
        if (mode === "text") return; // typed lines are added locally
        setLines((l) => [...l, { id: crypto.randomUUID(), who: "you", text: message }]);
        return;
      }
      if (message.trim() === lastStreamed.current) return; // already shown from the stream
      addGuideLine(message);
    },
    onError: (message) => setError(message),
    onDisconnect: (details) => {
      if (details.reason === "error") setError(details.message);
    },
  });

  const connected = conversation.status === "connected";

  async function start() {
    setError(null);
    setStarting(true);
    try {
      if (mode === "voice") {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          setError("We need the microphone for voice. Go back and choose typing if you prefer.");
          return;
        }
      }
      const res = await fetch("/api/agent/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persona: "employee" }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { signedUrl: string; dynamicVariables: Record<string, string> | null };
      };
      if (!json.ok || !json.data) {
        setError(json.error ?? "The guide is not available right now.");
        return;
      }
      conversation.startSession({
        signedUrl: json.data.signedUrl,
        connectionType: "websocket",
        dynamicVariables: json.data.dynamicVariables ?? startVariables,
        textOnly: mode === "text",
      });
    } catch {
      setError("We couldn't reach the server. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setLines((l) => [...l, { id: crypto.randomUUID(), who: "you", text }]);
    conversation.sendUserMessage(text);
    setDraft("");
  }

  const statusLabel =
    conversation.status === "connecting"
      ? "Connecting…"
      : !connected
        ? "Not started"
        : conversation.isSpeaking
          ? "Guide is speaking"
          : mode === "voice"
            ? "Listening"
            : "Connected";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="rounded-full bg-muted px-3 py-1 text-sm font-bold">
          {statusLabel}
        </p>
        <div className="flex gap-2">
          {mode === "voice" && connected && (
            <Button
              type="button"
              variant="outline"
              onClick={() => conversation.setMuted(!conversation.isMuted)}
              aria-pressed={conversation.isMuted}
            >
              {conversation.isMuted ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
              {conversation.isMuted ? "Unmute" : "Mute"}
            </Button>
          )}
          {connected ? (
            <Button type="button" variant="outline" onClick={() => conversation.endSession()}>
              <PhoneOff aria-hidden="true" /> End
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={start} disabled={starting || conversation.status === "connecting"}>
              {starting ? "Starting…" : mode === "voice" ? "Start talking" : "Start typing"}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-coral-soft p-3 font-bold text-coral-foreground">
          {error}
        </p>
      )}

      <div className="min-h-64 rounded-lg border p-4">
        <Transcript lines={lines} />
      </div>

      {connected && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <label htmlFor="guide-input" className="sr-only">
            Your message
          </label>
          <Input
            id="guide-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={mode === "voice" ? "Or type here" : "Type here"}
          />
          <Button type="submit" aria-label="Send">
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
  );
}
