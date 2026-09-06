"use client";

import { useActionState } from "react";
import { Field, fieldAria } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logIn } from "@/lib/auth/actions";
import type { FormState } from "@/lib/auth/schemas";

const initial: FormState = {};

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState(logIn, initial);
  const e = state.fieldErrors ?? {};
  const error = state.error ?? initialError;

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="email" label="Email" error={e.email}>
        <Input id="email" name="email" type="email" autoComplete="email" {...fieldAria("email", { error: e.email })} />
      </Field>
      <Field id="password" label="Password" error={e.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" {...fieldAria("password", { error: e.password })} />
      </Field>
      {error && (
        <p role="alert" className="rounded-2xl bg-coral-soft p-4 font-bold text-coral-foreground">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}
