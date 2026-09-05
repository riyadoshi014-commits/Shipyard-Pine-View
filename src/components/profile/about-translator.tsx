"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Field, fieldAria } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * The "recruiter that works for you" translator, always available on the
 * profile form -- not just for people who upload a resume. Renders the same
 * two fields EmployeeProfileForm already submits (about_raw, about), plus a
 * button that asks the model for a professional rewrite of about_raw and
 * lets the person choose to keep it. Nothing saves until the surrounding
 * form's own "Save my profile" button is pressed -- this component only
 * fills in the about textarea, it doesn't call any save action itself.
 */
export function AboutTranslator({
  initialRaw,
  initialAbout,
  rawError,
  aboutError,
}: {
  initialRaw: string;
  initialAbout: string;
  rawError?: string;
  aboutError?: string;
}) {
  const [raw, setRaw] = useState(initialRaw);
  const [about, setAbout] = useState(initialAbout);
  const [loading, setLoading] = useState(false);

  async function polish() {
    if (!raw.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/profile/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't rewrite that. Please try again.");
        return;
      }
      if (data.professional) setAbout(data.professional);
    } catch {
      toast.error("Couldn't rewrite that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Field id="about_raw" label="In your own words" hint="A time you did a good job at something." error={rawError}>
        <Textarea
          id="about_raw"
          name="about_raw"
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          {...fieldAria("about_raw", { hint: true, error: rawError })}
        />
      </Field>
      <Button type="button" variant="outline" onClick={polish} disabled={loading || !raw.trim()} className="self-start">
        {loading ? "Writing…" : "Polish my words"}
      </Button>
      <Field id="about" label="Professional version" hint="This is what employers read. You can edit it too." error={aboutError}>
        <Textarea
          id="about"
          name="about"
          rows={4}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          {...fieldAria("about", { hint: true, error: aboutError })}
        />
      </Field>
    </>
  );
}
