import Link from "next/link";
import { PassportCard } from "@/components/passport/passport-card";
import { PassportShare } from "@/components/passport/passport-qr";
import { Button } from "@/components/ui/button";
import { ME, OTHER_EMPLOYEES, SITE_URL } from "@/lib/sample";

export const metadata = { title: "Ability Passport" };

export default async function PassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = [ME, ...OTHER_EMPLOYEES].find((p) => p.slug === slug) ?? ME;
  const url = `${SITE_URL}/p/${person.slug}`;

  return (
    <>
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="text-2xl font-bold text-green">
            ConnectAble
          </Link>
          <Button variant="outline" render={<Link href="/signup" />}>
            Get your own Passport
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-8 md:grid-cols-[1fr_auto]">
        <PassportCard person={person} />
        <PassportShare url={url} />
      </main>
    </>
  );
}
