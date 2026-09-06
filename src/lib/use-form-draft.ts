"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { CONSENT_EVENT, hasDraftConsent } from "@/lib/consent";

/**
 * Keeps a working copy of a form on the person's own device so closing the
 * tab, a refresh, or wandering off doesn't lose what they typed. Gated on the
 * `connectable.consent` cookie -- nothing is written until they opt in via the
 * consent banner. The draft body lives in localStorage under
 * `connectable.draft.<key>`, mirroring src/lib/agent/local-store.ts.
 *
 * Works with uncontrolled fields out of the box (it sets the DOM nodes and
 * fires a native input event so React's onChange sees it). Controlled forms
 * that keep their own state (chips, seeded inputs) pass `onRestore` to push
 * the restored values into their setters.
 *
 * Password fields are never captured.
 */

type DraftValues = Record<string, string | string[]>;

type Options = {
  key: string;
  formRef: React.RefObject<HTMLFormElement | null>;
  /** Off for e.g. editing an existing record. Default true. */
  enabled?: boolean;
  /** Field names to never persist (password inputs are always skipped). */
  exclude?: string[];
  /** Given the restored values, apply anything the DOM can't (controlled state). */
  onRestore?: (values: DraftValues) => void;
};

const PREFIX = "connectable.draft.";

function readDraft(key: string): DraftValues | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as DraftValues) : null;
  } catch {
    return null;
  }
}

function writeDraft(key: string, values: DraftValues): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(values));
  } catch {
    // Private mode, quota, or storage disabled -- degrade to no-op.
  }
}

function removeDraft(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

function isSkippableField(el: Element, exclude: Set<string>): boolean {
  const name = (el as HTMLInputElement).name;
  if (!name || exclude.has(name)) return true;
  if (el instanceof HTMLInputElement && (el.type === "password" || el.type === "file")) return true;
  return false;
}

function snapshot(form: HTMLFormElement, exclude: Set<string>): DraftValues {
  const data = new FormData(form);
  const out: DraftValues = {};
  for (const key of new Set(data.keys())) {
    if (exclude.has(key)) continue;
    const field = form.elements.namedItem(key);
    if (field instanceof HTMLInputElement && (field.type === "password" || field.type === "file")) continue;
    const all = data.getAll(key).map(String);
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  return out;
}

// Guarded: this module is bundled for SSR too, where these globals don't exist.
const nativeInputValue =
  typeof HTMLInputElement !== "undefined"
    ? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
    : undefined;
const nativeTextareaValue =
  typeof HTMLTextAreaElement !== "undefined"
    ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
    : undefined;

function setFieldValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  if (el instanceof HTMLInputElement && nativeInputValue) nativeInputValue.call(el, value);
  else if (el instanceof HTMLTextAreaElement && nativeTextareaValue) nativeTextareaValue.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// Only ever called from inside an effect, so DOM globals are present.
function applyToDom(form: HTMLFormElement, values: DraftValues, exclude: Set<string>) {
  for (const [name, value] of Object.entries(values)) {
    if (Array.isArray(value)) continue; // multi-value (chips) -- left to onRestore
    if (exclude.has(name)) continue;
    const field = form.elements.namedItem(name);
    if (!field) continue;

    // A radio group comes back as a RadioNodeList; its value setter checks
    // the matching radio for us.
    if (field instanceof RadioNodeList) {
      field.value = value;
      form.dispatchEvent(new Event("change", { bubbles: true }));
      continue;
    }
    if (isSkippableField(field, exclude)) continue;

    if (field instanceof HTMLInputElement && field.type === "checkbox") {
      field.checked = value === "on" || value === "true";
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      setFieldValue(field, value);
    }
  }
}

export function useFormDraft({ key, formRef, enabled = true, exclude = [], onRestore }: Options) {
  const excludeSet = useRef(new Set(exclude));
  excludeSet.current = new Set(exclude);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const active = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(() => {
    const form = formRef.current;
    if (!enabled || !active.current || !form) return;
    writeDraft(key, snapshot(form, excludeSet.current));
  }, [key, enabled, formRef]);

  const clear = useCallback(() => removeDraft(key), [key]);

  // Restore once, and keep `active` in sync with consent.
  useEffect(() => {
    if (!enabled) return;
    active.current = hasDraftConsent();
    const onConsent = () => {
      active.current = hasDraftConsent();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);

    const form = formRef.current;
    if (active.current && form) {
      const saved = readDraft(key);
      if (saved && Object.keys(saved).length > 0) {
        applyToDom(form, saved, excludeSet.current);
        onRestoreRef.current?.(saved);
        toast("We brought back what you had typed.", {
          action: {
            label: "Start over",
            onClick: () => {
              removeDraft(key);
              window.location.reload();
            },
          },
        });
      }
    }
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, [key, enabled, formRef]);

  // Debounced save on any edit + immediate save when the tab is hidden or left.
  useEffect(() => {
    if (!enabled) return;
    const form = formRef.current;
    if (!form) return;

    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(save, 500);
    };
    const flushIfHidden = () => {
      if (document.visibilityState === "hidden") save();
    };

    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", flushIfHidden);
    window.addEventListener("pagehide", save);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      form.removeEventListener("input", schedule);
      form.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", flushIfHidden);
      window.removeEventListener("pagehide", save);
    };
  }, [enabled, save, formRef]);

  return { clear };
}
