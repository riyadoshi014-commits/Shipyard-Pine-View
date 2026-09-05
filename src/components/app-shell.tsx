import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/role-badge";
import type { Role } from "@/lib/domain";

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  employee: [
    { href: "/app", label: "Home" },
    { href: "/app/passport", label: "My Passport" },
    { href: "/app/profile", label: "Edit profile" },
    { href: "/app/matches", label: "Matches" },
  ],
  employer: [
    { href: "/app/employer", label: "Home" },
    { href: "/app/employer/jobs/lot-attendant/candidates", label: "Candidates" },
    { href: "/app/employer/jobs/new", label: "Post a job" },
  ],
  mentor: [{ href: "/app", label: "Home" }],
};

const NAMES: Record<Role, string> = { employee: "Nick Alvarez", employer: "Dana Whitfield", mentor: "Sam Ortiz" };

export function AppShell({ persona: role, children }: { persona: Role; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link href="/" className="text-2xl font-bold text-green">
            ConnectAble
          </Link>
          <nav aria-label="App">
            <ul className="flex flex-wrap gap-1">
              {NAV[role].map((item) => (
                <li key={item.href}>
                  <Button variant="ghost" render={<Link href={item.href} />}>
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{NAMES[role]}</span>
            <RoleBadge role={role} />
            <Button variant="outline" render={<Link href={role === "employee" ? "/app/employer" : "/app"} />}>
              {role === "employee" ? "View as employer" : "View as job seeker"}
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </>
  );
}
