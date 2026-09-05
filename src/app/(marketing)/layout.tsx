import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const LINKS = [
  { href: "/about", label: "About us" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms and conditions" },
  { href: "https://TheInclusionRevolution.org", label: "Inclusion Revolution" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="mt-auto border-t bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold">ConnectAble · an Inclusion Revolution project</p>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-4">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </>
  );
}
