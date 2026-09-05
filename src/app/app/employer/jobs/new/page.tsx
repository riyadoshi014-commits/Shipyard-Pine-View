import { AppShell } from "@/components/app-shell";
import { ChipPicker } from "@/components/chip-picker";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ABILITY_SUGGESTIONS, ACCOMMODATION_SUGGESTIONS, AVAILABILITY_OPTIONS, EMPLOYER } from "@/lib/sample";

export const metadata = { title: "Post a job" };

export default function NewJobPage() {
  return (
    <AppShell persona="employer">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Post a job" description="Describe the work in plain language. Candidates are matched on abilities, not titles." />
        <form action="/app/employer/jobs/lot-attendant/candidates" className="flex flex-col gap-8">
          <Field id="title" label="Job title">
            <Input id="title" placeholder="Lot Attendant" />
          </Field>
          <Field id="description" label="What does a good day look like?" hint="Short sentences. What they do, who they work with, what success looks like.">
            <Textarea id="description" rows={4} aria-describedby="description-hint" />
          </Field>
          <ChipPicker name="abilities_required" label="Abilities this job needs" suggestions={ABILITY_SUGGESTIONS} />
          <ChipPicker name="accommodations_offered" label="Accommodations you can provide" suggestions={ACCOMMODATION_SUGGESTIONS} initial={EMPLOYER.accommodations_offered} />
          <ChipPicker name="availability" label="Shifts" suggestions={AVAILABILITY_OPTIONS} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="city" label="City">
              <Input id="city" defaultValue={EMPLOYER.city} />
            </Field>
            <Field id="state" label="State">
              <Input id="state" defaultValue={EMPLOYER.state} />
            </Field>
            <Field id="remote" label="Where">
              <NativeSelect id="remote" defaultValue="in_person">
                <option value="in_person">In person</option>
                <option value="remote">Remote</option>
                <option value="either">Either</option>
              </NativeSelect>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="salary_min" label="Pay from ($ / hour)">
              <Input id="salary_min" type="number" min={0} step="0.5" inputMode="decimal" />
            </Field>
            <Field id="salary_max" label="Pay to ($ / hour)">
              <Input id="salary_max" type="number" min={0} step="0.5" inputMode="decimal" />
            </Field>
          </div>
          <p className="text-sm text-muted-foreground">Job seekers see this pay range. You never see theirs.</p>
          <Button type="submit" size="lg" className="self-start">
            Post job and see candidates
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
