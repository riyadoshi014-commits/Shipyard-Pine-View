import { Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChipPicker } from "@/components/chip-picker";
import { Field } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { HistoryItem } from "@/lib/domain";
import { ABILITY_SUGGESTIONS, ACCOMMODATION_SUGGESTIONS, AVAILABILITY_OPTIONS, ME } from "@/lib/sample";

export const metadata = { title: "Edit profile" };

const REMOTE_OPTIONS = [
  { value: "in_person", label: "In person" },
  { value: "remote", label: "Remote" },
  { value: "either", label: "Either is fine" },
];

function HistoryList({ title, items }: { title: string; items: HistoryItem[] }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing added yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.title} className="flex items-start justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-bold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{[item.org, item.year].filter(Boolean).join(" · ")}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${item.title}`}>
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AppShell persona="employee">
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Edit your profile" description="Everything here goes on your Ability Passport, except pay." />

        <div className="mb-10 flex flex-col gap-3 rounded-lg border bg-muted p-4">
          <label htmlFor="resume" className="text-base font-bold">
            Have a resume? Upload it and we will fill in what we can.
          </label>
          <p className="text-sm text-muted-foreground">PDF or .txt, up to 10 MB.</p>
          <div className="flex flex-wrap gap-2">
            <input id="resume" type="file" accept=".pdf,.txt" className="text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-2" />
            <Button type="button" variant="outline">
              <Upload aria-hidden="true" /> Upload
            </Button>
          </div>
        </div>

        <form action="/app/passport" className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Basics</h2>
            <Field id="headline" label="One line about you at work" hint='For example "Friendly team member who loves organizing".'>
              <Input id="headline" defaultValue={ME.headline} aria-describedby="headline-hint" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City">
                <Input id="city" defaultValue={ME.city} />
              </Field>
              <Field id="state" label="State">
                <NativeSelect id="state" defaultValue={ME.state}>
                  {["FL", "GA", "AL", "SC", "NC"].map((s) => (
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
                  <input type="radio" name="remote" value={o.value} defaultChecked={ME.remotePreference === o.value} className="size-5 accent-green" />
                  {o.label}
                </label>
              ))}
            </fieldset>
          </section>

          <ChipPicker name="abilities" label="Abilities" description="Things you are good at, at work or at home." suggestions={ABILITY_SUGGESTIONS} initial={ME.abilities} />
          <ChipPicker name="accommodations" label="Accommodations" description="What helps you do your best work." suggestions={ACCOMMODATION_SUGGESTIONS} initial={ME.accommodations} />
          <ChipPicker name="availability" label="Availability" description="When you can work." suggestions={AVAILABILITY_OPTIONS} initial={ME.availability} />

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Your story</h2>
            <Field id="about_raw" label="In your own words" hint="A time you did a good job at something.">
              <Textarea id="about_raw" rows={4} defaultValue={ME.aboutRaw} aria-describedby="about_raw-hint" />
            </Field>
            <Field id="about" label="Professional version" hint="This is what employers read. The guide can write it for you.">
              <Textarea id="about" rows={4} defaultValue={ME.about} aria-describedby="about-hint" />
            </Field>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-bold">Awards, education and volunteering</h2>
            <HistoryList title="Education and training" items={ME.education} />
            <HistoryList title="Awards" items={ME.awards} />
            <HistoryList title="Volunteering" items={ME.volunteer} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-bold">Pay</h2>
            <p className="text-sm text-muted-foreground">Private. Employers never see these numbers. We only use them to find good fits.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="salary_min" label="Lowest hourly pay that feels fair ($)">
                <Input id="salary_min" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={ME.salaryMin ?? ""} />
              </Field>
              <Field id="salary_max" label="Highest hourly pay ($)">
                <Input id="salary_max" type="number" min={0} step="0.5" inputMode="decimal" defaultValue={ME.salaryMax ?? ""} />
              </Field>
            </div>
          </section>

          <Button type="submit" size="lg">
            Save my profile
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
