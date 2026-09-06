"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ChipPicker } from "@/components/chip-picker";
import { Field, fieldAria } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/auth/schemas";
import type { EmployerProfile } from "@/lib/domain";
import { saveEmployerProfile } from "@/lib/employer/actions";
import { ACCOMMODATION_SUGGESTIONS, US_STATES } from "@/lib/sample";
import { useFormDraft } from "@/lib/use-form-draft";

const initial: FormState = {};

export function EmployerProfileForm({ profile, fullName }: { profile: EmployerProfile | null; fullName: string }) {
  const [state, action, pending] = useActionState(saveEmployerProfile, initial);
  const e = state.fieldErrors ?? {};

  // The accommodations chip list isn't captured; the typed fields are.
  const formRef = useRef<HTMLFormElement>(null);
  const { clear: clearDraft } = useFormDraft({ key: "profile-employer", formRef });

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      clearDraft();
    }
  }, [state, clearDraft]);

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-4">
      <Field id="full_name" label="Your name" hint="The person managing this account." error={e.full_name}>
        <Input id="full_name" name="full_name" defaultValue={fullName} autoComplete="name" {...fieldAria("full_name", { hint: true, error: e.full_name })} />
      </Field>
      <Field id="company_name" label="Company name" error={e.company_name}>
        <Input id="company_name" name="company_name" defaultValue={profile?.company_name ?? ""} autoComplete="organization" {...fieldAria("company_name", { error: e.company_name })} />
      </Field>
      <Field id="description" label="About the company" hint="Two or three plain sentences. Job seekers read this." error={e.description}>
        <Textarea id="description" name="description" rows={3} defaultValue={profile?.description ?? ""} {...fieldAria("description", { hint: true, error: e.description })} />
      </Field>
      <Field id="website" label="Website" error={e.website}>
        <Input id="website" name="website" inputMode="url" defaultValue={profile?.website ?? ""} placeholder="example.com" {...fieldAria("website", { error: e.website })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="city" label="City" error={e.city}>
          <Input id="city" name="city" defaultValue={profile?.city ?? ""} {...fieldAria("city", { error: e.city })} />
        </Field>
        <Field id="state" label="State" error={e.state}>
          <NativeSelect id="state" name="state" defaultValue={profile?.state || "FL"}>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <ChipPicker
        name="accommodations_offered"
        label="Accommodations we can provide"
        description="Candidates are scored for these, never against them. They also become the default on new jobs."
        suggestions={ACCOMMODATION_SUGGESTIONS}
        initial={profile?.accommodations_offered ?? []}
      />
      {state.error && (
        <p role="alert" className="rounded-md bg-coral-soft p-3 font-bold text-coral-foreground">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending ? "Saving…" : "Save company"}
      </Button>
    </form>
  );
}
