"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { Field, fieldAria } from "@/components/form/field";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/auth/schemas";
import type { HistoryItem, HistoryKind } from "@/lib/domain";
import { addHistoryItem, removeHistoryItem } from "@/lib/profile/actions";

const KIND_LABEL: Record<HistoryKind, string> = {
  award: "Awards",
  education: "Education and training",
  volunteer: "Volunteering",
};

type Props = { awards: HistoryItem[]; education: HistoryItem[]; volunteer: HistoryItem[] };

const initial: FormState = {};

export function HistoryEditor({ awards, education, volunteer }: Props) {
  const [state, action, pending] = useActionState(addHistoryItem, initial);
  const e = state.fieldErrors ?? {};
  const groups: Array<[HistoryKind, HistoryItem[]]> = [
    ["education", education],
    ["award", awards],
    ["volunteer", volunteer],
  ];

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Awards, education and volunteering</h2>
      {groups.map(([kind, items]) => (
        <div key={kind}>
          <h3 className="mb-2 font-bold">{KIND_LABEL[kind]}</h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing added yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{[item.org, item.year].filter(Boolean).join(" · ")}</p>
                    {item.details && <p className="text-sm">{item.details}</p>}
                  </div>
                  <form action={removeHistoryItem}>
                    <input type="hidden" name="kind" value={kind} />
                    <input type="hidden" name="index" value={index} />
                    <Button type="submit" variant="ghost" size="icon" aria-label={`Remove ${item.title}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <form action={action} noValidate className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
        <p className="font-bold sm:col-span-2">Add one</p>
        <Field id="h-kind" label="Type">
          <NativeSelect id="h-kind" name="kind" defaultValue="education">
            <option value="education">Education or training</option>
            <option value="award">Award</option>
            <option value="volunteer">Volunteering</option>
          </NativeSelect>
        </Field>
        <Field id="h-title" label="Title" error={e.title}>
          <Input id="h-title" name="title" {...fieldAria("h-title", { error: e.title })} />
        </Field>
        <Field id="h-org" label="Organization or school">
          <Input id="h-org" name="org" />
        </Field>
        <Field id="h-year" label="Year">
          <Input id="h-year" name="year" placeholder="2024" />
        </Field>
        <Field id="h-details" label="One sentence of detail">
          <Input id="h-details" name="details" />
        </Field>
        <div className="flex items-end">
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </div>
        {state.error && (
          <p role="alert" className="text-sm font-bold text-destructive sm:col-span-2">
            {state.error}
          </p>
        )}
      </form>
    </section>
  );
}
