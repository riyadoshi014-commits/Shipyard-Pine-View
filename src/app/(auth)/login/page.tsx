import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { friendlyAuthError } from "@/lib/auth/schemas";

export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold">Welcome back</h1>
      <LoginForm next={next} initialError={error ? friendlyAuthError(error) : undefined} />
      <p className="mt-6 text-sm">
        New here?{" "}
        <Link href="/signup" className="font-bold text-green underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
