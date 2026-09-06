import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PassportCard } from "@/components/passport/passport-card";
import { PassportShare } from "@/components/passport/passport-qr";
import { Button } from "@/components/ui/button";
import { getPublicPassport } from "@/lib/data/passport";
import { SITE_URL } from "@/lib/sample";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const passport = await getPublicPassport(slug);
  if (!passport) return { title: "Ability Passport" };
  const title = `${passport.fullName}'s Ability Passport`;
  return { title, description: passport.headline, openGraph: { title, description: passport.headline } };
}

export default async function PassportPage({ params }: Params) {
  const { slug } = await params;
  const passport = await getPublicPassport(slug);
  if (!passport) notFound();
  const url = `${SITE_URL}/p/${slug}`;

  return (
    <div className="ap-site flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="ap-logo-mark" aria-hidden="true">
              C
            </span>
            <span className="text-2xl font-extrabold tracking-tight text-green">ConnectAble</span>
          </Link>
          <Button variant="outline" className="rounded-full" render={<Link href="/signup" />}>
            Get your own Passport
          </Button>
        </div>
      </header>
      <main id="main" className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-8 md:grid-cols-[1fr_auto]">
        <PassportCard person={passport} />
        <PassportShare url={url} />
      </main>
    </div>
  );
}
