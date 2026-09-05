"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { applyParsedResume } from "@/lib/profile/resume-import-actions";
import type { ParsedResume } from "@/lib/resume-parse";

/**
 * Lets someone paste resume text and see what ConnectAble found in it
 * before anything is saved. Nothing here writes to the profile until the
 * person clicks "Add these to my profile" -- see
 * src/lib/profile/resume-import-actions.ts for the write path, and
 * src/lib/resume-parse.ts for why the extraction never invents a fact.
 */
export function ResumeImport() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "We couldn't read that resume. Please try again.");
        return;
      }
      setParsed(data.parsed as ParsedResume);
    } catch {
      toast.error("We couldn't read that resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!parsed) return;
    startTransition(async () => {
      const result = await applyParsedResume(parsed);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Added.");
      setParsed(null);
      setText("");
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Import from a resume</h2>
      <p className="text-sm text-muted-foreground">
        Paste your resume text below. We only use what it actually says -- nothing is added or guessed. You choose
        what to keep before anything is saved.
      </p>
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your resume text here"
        aria-label="Resume text"
      />
      <Button type="button" onClick={handleParse} disabled={loading || !text.trim()} className="self-start">
        {loading ? "Reading…" : "Read my resume"}
      </Button>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Here&apos;s what we found</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {parsed.headline && (
              <p>
                <strong>Headline:</strong> {parsed.headline}
              </p>
            )}
            {(parsed.city || parsed.state) && (
              <p>
                <strong>Location:</strong> {[parsed.city, parsed.state].filter(Boolean).join(", ")}
              </p>
            )}
            {parsed.about && (
              <p>
                <strong>About:</strong> {parsed.about}
              </p>
            )}
            {parsed.abilities.length > 0 && (
              <p>
                <strong>Abilities:</strong> {parsed.abilities.join(", ")}
              </p>
            )}
            {parsed.history.length > 0 && (
              <div>
                <strong>History:</strong>
                <ul className="ml-4 list-disc">
                  {parsed.history.map((h, i) => (
                    <li key={i}>
                      {h.title}
                      {h.org ? ` -- ${h.org}` : ""}
                      {h.year ? ` (${h.year})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {parsed.abilities.length === 0 && parsed.history.length === 0 && !parsed.headline && !parsed.about && (
              <p className="text-muted-foreground">We didn&apos;t find anything usable in that text.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={handleAccept} disabled={pending}>
                {pending ? "Adding…" : "Add these to my profile"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setParsed(null)}>
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
