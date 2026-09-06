import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const LINKS = [
  { href: "/about", label: "About us" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms and conditions" },
  { href: "/terms/employee", label: "Job Seeker Agreement" },
  { href: "/terms/employer", label: "Employer & Operator Agreement" },
  { href: "/terms/mentor", label: "Mentor Agreement" },
  { href: "https://TheInclusionRevolution.org", label: "Inclusion Revolution" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap-site flex flex-1 flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        {children}
      </main>
      <footer className="mt-auto border-t bg-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm lg:flex-row lg:items-start lg:justify-between">
          <p className="font-bold">ConnectAble · an Inclusion Revolution project</p>
          <address className="flex shrink-0 flex-col not-italic" aria-label="Company contact information">
            <span className="mb-1 font-bold">Get in touch</span>
            <a href="tel:+19412394045" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">+1 941-239-4045</a>
            <a href="mailto:info@connectable.work" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">info@connectable.work</a>
          </address>
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
    </div>
  );
}
