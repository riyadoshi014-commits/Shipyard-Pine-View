"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { ChipPicker } from "@/components/chip-picker";
import { Field, fieldAria } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { AboutTranslator } from "@/components/profile/about-translator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/auth/schemas";
import type { EmployeePrivate, EmployeeProfile } from "@/lib/domain";
import { saveEmployeeProfile } from "@/lib/profile/actions";
import { ABILITY_SUGGESTIONS, ACCOMMODATION_SUGGESTIONS, AVAILABILITY_OPTIONS, US_STATES } from "@/lib/sample";

const REMOTE_OPTIONS = [
  { value: "in_person", label: "In person" },
  { value: "remote", label: "Remote" },
  { value: "either", label: "Either is fine" },
] as const;

type Props = { profile: EmployeeProfile | null; priv: Pick<EmployeePrivate, "salary_min" | "salary_max"> | null };

const initial: FormState = {};

export function EmployeeProfileForm({ profile, priv }: Props) {
  const [state, action, pending] = useActionState(saveEmployeeProfile, initial);
  const e = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) toast.success(state.success);
  }, [state]);

  return (
    <form action={action} noValidate className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Basics</h2>
        <Field id="headline" label="One line about you at work" hint='For example "Friendly team member who loves organizing".' error={e.headline}>
          <Input id="headline" name="headline" defaultValue={profile?.headline ?? ""} {...fieldAria("headline", { hint: true, error: e.headline })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="city" label="City" error={e.city}>
            <Input id="city" name="city" defaultValue={profile?.city ?? ""} autoComplete="address-level2" {...fieldAria("city", { error: e.city })} />
          </Field>
          <Field id="state" label="State" error={e.state}>
            <NativeSelect id="state" name="state" defaultValue={profile?.state || "FL"} {...fieldAria("state", { error: e.state })}>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-base font-bold">Where do you want to work?</legend>
          {REMOTE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-3 rounded-lg border p-3 has-[:checked]:border-green has-[:checked]:bg-green-soft">
              <input type="radio" name="remote_preference" value={o.value} defaultChecked={(profile?.remote_preference ?? "either") === o.value} className="size-5 accent-green" />
              {o.label}
            </label>
          ))}
        </fieldset>
      </section>

      <ChipPicker name="abilities" label="Abilities" description="Things you are good at, at work or at home." suggestions={ABILITY_SUGGESTIONS} initial={profile?.abilities ?? []} />
      <ChipPicker name="accommodations" label="Accommodations" description="What helps you do your best work." suggestions={ACCOMMODATION_SUGGESTIONS} initial={profile?.accommodations ?? []} />
      <ChipPicker name="availability" label="Availability" description="When you can work." suggestions={AVAILABILITY_OPTIONS} initial={profile?.availability ?? []} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Your story</h2>
        <AboutTranslator
          initialRaw={profile?.about_raw ?? ""}
          initialAbout={profile?.about ?? ""}
          rawError={e.about_raw}
          aboutError={e.about}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Pay</h2>
        <p className="text-sm text-muted-foreground">Private. Employers never see these numbers. We only use them to find good fits.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="salary_min" label="Lowest hourly pay that feels fair ($)" error={e.salary_min}>
            <Input id="salary_min" name="salary_min" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={priv?.salary_min ?? ""} {...fieldAria("salary_min", { error: e.salary_min })} />
          </Field>
          <Field id="salary_max" label="Highest hourly pay ($)" error={e.salary_max}>
            <Input id="salary_max" name="salary_max" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={priv?.salary_max ?? ""} {...fieldAria("salary_max", { error: e.salary_max })} />
          </Field>
        </div>
      </section>

      {state.error && (
        <p role="alert" className="rounded-md bg-coral-soft p-3 font-bold text-coral-foreground">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save my profile"}
      </Button>
    </form>
  );
}
