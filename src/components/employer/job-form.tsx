"use client";

import { useActionState, useRef, useState } from "react";
import { ChipPicker } from "@/components/chip-picker";
import { JobDescriptionAssist } from "@/components/employer/job-description-assist";
import { Field, fieldAria } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/auth/schemas";
import type { Job } from "@/lib/domain";
import { saveJob } from "@/lib/employer/actions";
import type { ParsedJobTasks } from "@/lib/job-task-parse";
import { ABILITY_SUGGESTIONS, ACCOMMODATION_SUGGESTIONS, AVAILABILITY_OPTIONS, US_STATES } from "@/lib/sample";
import { useFormDraft } from "@/lib/use-form-draft";

type Props = { job: Job | null; defaults: { city: string; state: string; accommodations_offered: string[] } };

const initial: FormState = {};

export function JobForm({ job, defaults }: Props) {
  const [state, action, pending] = useActionState(saveJob, initial);
  const e = state.fieldErrors ?? {};

  // Only keep a draft for a brand-new posting -- editing an existing job
  // already has its saved values, and its chip re-seed logic would fight a
  // restore. Chip lists (abilities/accommodations/shifts) aren't captured;
  // the text fields, which are where the typing goes, are.
  const formRef = useRef<HTMLFormElement>(null);
  const { clear: clearDraft } = useFormDraft({ key: "job-new", formRef, enabled: !job });

  // Seeded from the manual defaults, then re-seeded (with a bumped key to
  // force ChipPicker/Input to pick up the new `initial`/`value`) whenever
  // JobDescriptionAssist suggestions are accepted. Manual edits after that
  // still work normally -- this only changes what the fields start from.
  const [title, setTitle] = useState(job?.title ?? "");
  const [abilitiesSeed, setAbilitiesSeed] = useState(job?.abilities_required ?? []);
  const [accommodationsSeed, setAccommodationsSeed] = useState(job?.accommodations_offered ?? defaults.accommodations_offered);
  const [seedVersion, setSeedVersion] = useState(0);

  function acceptSuggestions(suggestion: ParsedJobTasks) {
    if (suggestion.suggestedTitle) setTitle(suggestion.suggestedTitle);
    const mergeUnique = (current: string[], additions: string[]) => {
      const seen = new Set(current.map((s) => s.toLowerCase()));
      const merged = current.slice();
      for (const a of additions) {
        if (!seen.has(a.toLowerCase())) {
          seen.add(a.toLowerCase());
          merged.push(a);
        }
      }
      return merged;
    };
    if (suggestion.suggestedAbilities.length > 0) {
      setAbilitiesSeed((prev) => mergeUnique(prev, suggestion.suggestedAbilities));
    }
    if (suggestion.suggestedAccommodations.length > 0) {
      setAccommodationsSeed((prev) => mergeUnique(prev, suggestion.suggestedAccommodations));
    }
    setSeedVersion((v) => v + 1);
  }

  return (
    <form ref={formRef} action={action} onSubmit={() => clearDraft()} noValidate className="flex flex-col gap-8">
      {job && <input type="hidden" name="id" value={job.id} />}
      <JobDescriptionAssist onAccept={acceptSuggestions} />
      <Field id="title" label="Job title" error={e.title}>
        <Input
          key={`title-${seedVersion}`}
          id="title"
          name="title"
          value={title}
          onChange={(evt) => setTitle(evt.target.value)}
          placeholder="Lot Attendant"
          {...fieldAria("title", { error: e.title })}
        />
      </Field>
      <Field id="description" label="What does a good day look like?" hint="Short sentences. What they do, who they work with, what success looks like." error={e.description}>
        <Textarea id="description" name="description" rows={4} defaultValue={job?.description ?? ""} {...fieldAria("description", { hint: true, error: e.description })} />
      </Field>
      <div>
        <ChipPicker
          key={`abilities-${seedVersion}`}
          name="abilities_required"
          label="Abilities this job needs"
          description="Pick the real ones. Candidates are matched on these."
          suggestions={ABILITY_SUGGESTIONS}
          initial={abilitiesSeed}
        />
        {e.abilities_required && (
          <p role="alert" className="mt-2 text-sm font-bold text-destructive">
            {e.abilities_required}
          </p>
        )}
      </div>
      <ChipPicker
        key={`accommodations-${seedVersion}`}
        name="accommodations_offered"
        label="Accommodations you can provide"
        suggestions={ACCOMMODATION_SUGGESTIONS}
        initial={accommodationsSeed}
      />
      <ChipPicker name="availability" label="Shifts" suggestions={AVAILABILITY_OPTIONS} initial={job?.availability ?? []} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="city" label="City" error={e.city}>
          <Input id="city" name="city" defaultValue={job?.city ?? defaults.city} {...fieldAria("city", { error: e.city })} />
        </Field>
        <Field id="state" label="State">
          <NativeSelect id="state" name="state" defaultValue={job?.state || defaults.state || "FL"}>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="remote" label="Where">
          <NativeSelect id="remote" name="remote" defaultValue={job?.remote ?? "in_person"}>
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
            <option value="either">Either</option>
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="salary_min" label="Pay from ($ / hour)" error={e.salary_min}>
          <Input id="salary_min" name="salary_min" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={job?.salary_min ?? ""} {...fieldAria("salary_min", { error: e.salary_min })} />
        </Field>
        <Field id="salary_max" label="Pay to ($ / hour)" error={e.salary_max}>
          <Input id="salary_max" name="salary_max" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={job?.salary_max ?? ""} {...fieldAria("salary_max", { error: e.salary_max })} />
        </Field>
      </div>
      <p className="text-sm text-muted-foreground">Job seekers see this pay range. You never see theirs.</p>
      {job && (
        <Field id="status" label="Is this job open?" hint="Open jobs show up for candidates. Closed jobs are hidden and stop matching.">
          <NativeSelect id="status" name="status" defaultValue={job.status}>
            <option value="open">Open for candidates</option>
            <option value="closed">Closed</option>
          </NativeSelect>
        </Field>
      )}
      {state.error && (
        <p role="alert" className="rounded-md bg-coral-soft p-3 font-bold text-coral-foreground">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending ? "Saving…" : job ? "Save changes and see candidates" : "Post job and see candidates"}
      </Button>
    </form>
  );
}
