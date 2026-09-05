import Link from "next/link";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Welcome back</h1>
      <form action="/app" className="flex flex-col gap-6">
        <Field id="email" label="Email">
          <Input id="email" type="email" autoComplete="email" />
        </Field>
        <Field id="password" label="Password">
          <Input id="password" type="password" autoComplete="current-password" />
        </Field>
        <Button type="submit" size="lg">
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm">
        New here?{" "}
        <Link href="/signup" className="font-bold text-green underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
