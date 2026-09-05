import Link from "next/link";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Sign up" };

const ROLE_OPTIONS = [
  { value: "employee", label: "I'm looking for a job", hint: "Build your Ability Passport and get matched." },
  { value: "employer", label: "I'm hiring", hint: "Post a role and see candidates ranked by fit." },
  { value: "mentor", label: "I'm a mentor", hint: "Support a job seeker through the process." },
];

export default function SignupPage() {
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
      <p className="mb-6 text-muted-foreground">It takes about a minute.</p>
      <form action="/onboarding" className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-base font-bold">First, who are you?</legend>
          {ROLE_OPTIONS.map((r, i) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-green has-[:checked]:bg-green-soft"
            >
              <input type="radio" name="role" value={r.value} defaultChecked={i === 0} className="mt-1 size-5 accent-green" />
              <span className="font-bold">{r.label}</span>
              <span className="block text-sm text-muted-foreground">{r.hint}</span>
            </label>
          ))}
        </fieldset>
        <Field id="full_name" label="Your name">
          <Input id="full_name" autoComplete="name" />
        </Field>
        <Field id="email" label="Email">
          <Input id="email" type="email" autoComplete="email" />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters.">
          <Input id="password" type="password" autoComplete="new-password" aria-describedby="password-hint" />
        </Field>
        <Button type="submit" size="lg">
          Create my account
        </Button>
      </form>
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-green underline">
          Log in
        </Link>
      </p>
    </>
  );
}
