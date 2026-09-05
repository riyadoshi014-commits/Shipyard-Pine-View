import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  return (
    <>
      <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
      <p className="mb-6 text-muted-foreground">It takes about a minute.</p>
      <SignupForm defaultRole={role} />
      <p className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-green underline">
          Log in
        </Link>
      </p>
    </>
  );
}
