"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ParsedJobTasks } from "@/lib/job-task-parse";

/**
 * The employer-side mirror of ResumeImport: describe the job in plain
 * language and see structured suggestions before anything touches the real
 * form. This never saves anything itself -- accepting only pre-fills the
 * job title, abilities, and accommodations fields already rendered by
 * JobForm; the employer still has to press the form's own submit button
 * for any of it to be saved. Manual entry in those fields keeps working
 * whether or not this is ever used, same as resume import never being
 * required to fill out a profile.
 */
export function JobDescriptionAssist({ onAccept }: { onAccept: (suggestion: ParsedJobTasks) => void }) {
  const [description, setDescription] = useState("");
  const [parsed, setParsed] = useState<ParsedJobTasks | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSuggest() {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "We couldn't read that description. Please try again.");
        return;
      }
      setParsed(data.parsed as ParsedJobTasks);
    } catch {
      toast.error("We couldn't read that description. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (!parsed) return;
    onAccept(parsed);
    toast.success("Added to the fields below. Review and edit before posting.");
    setParsed(null);
    setDescription("");
  }

  const nothingFound =
    parsed && !parsed.suggestedTitle && parsed.suggestedAbilities.length === 0 && parsed.suggestedAccommodations.length === 0;

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h2 className="text-lg font-bold">Not sure how to describe it?</h2>
        <p className="text-sm text-muted-foreground">
          Describe the job in your own words below. We&apos;ll suggest a title and abilities from what you actually
          wrote -- nothing is added or guessed beyond that. You choose what to keep.
        </p>
      </div>
      <Textarea
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. I need someone to help me during the lunch rush, mostly running the register and keeping the counter stocked."
        aria-label="Describe the job in your own words"
      />
      <Button type="button" variant="outline" onClick={handleSuggest} disabled={loading || !description.trim()} className="self-start">
        {loading ? "Thinking…" : "Suggest abilities"}
      </Button>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle>Here&apos;s what we found</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {parsed.suggestedTitle && (
              <p>
                <strong>Title:</strong> {parsed.suggestedTitle}
              </p>
            )}
            {parsed.suggestedAbilities.length > 0 && (
              <p>
                <strong>Abilities:</strong> {parsed.suggestedAbilities.join(", ")}
              </p>
            )}
            {parsed.suggestedAccommodations.length > 0 && (
              <p>
                <strong>Accommodations you could offer:</strong> {parsed.suggestedAccommodations.join(", ")}
              </p>
            )}
            {nothingFound && <p className="text-muted-foreground">We didn&apos;t find anything usable in that text.</p>}
            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={handleAccept} disabled={!!nothingFound}>
                Use these suggestions
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
