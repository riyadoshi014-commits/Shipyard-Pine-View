"use client";

import { useId, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  name: string;
  label: string;
  suggestions: string[];
  initial?: string[];
  description?: string;
};

/** Pick from suggestions or add your own. Selected items become hidden inputs. */
export function ChipPicker({ name, label, suggestions, initial = [], description }: Props) {
  const id = useId();
  const [selected, setSelected] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");

  const has = (item: string) => selected.some((s) => s.toLowerCase() === item.trim().toLowerCase());
  const add = (item: string) => {
    const clean = item.trim().replace(/\s+/g, " ").slice(0, 60);
    if (!clean || has(clean)) return;
    setSelected((s) => [...s, clean]);
  };
  const remove = (item: string) => setSelected((s) => s.filter((x) => x !== item));
  const addDraft = () => {
    add(draft);
    setDraft("");
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-base font-bold">{label}</legend>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <ul aria-label={`Selected ${label.toLowerCase()}`} className="flex flex-wrap gap-2">
        {selected.length === 0 && <li className="text-sm text-muted-foreground">Nothing picked yet.</li>}
        {selected.map((item) => (
          <li
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-green-soft py-1.5 pr-1.5 pl-3 text-sm font-bold text-green"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => remove(item)}
              className="grid size-7 place-items-center rounded-full hover:bg-green/10"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
            <input type="hidden" name={name} value={item} />
          </li>
        ))}
      </ul>

      {suggestions.some((s) => !has(s)) && (
        <div className="flex flex-wrap gap-2">
          {suggestions
            .filter((s) => !has(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Add ${s}`}
                onClick={() => add(s)}
                className="rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
              >
                + {s}
              </button>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <label htmlFor={`${id}-add`} className="sr-only">
          Add your own
        </label>
        <Input
          id={`${id}-add`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Add your own"
        />
        <Button type="button" variant="outline" onClick={addDraft}>
          Add
        </Button>
      </div>
    </fieldset>
  );
}
