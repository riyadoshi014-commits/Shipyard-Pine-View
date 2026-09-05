import Link from "next/link";
import { RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import type { CurrentProfile } from "@/lib/data/profile";
import type { Role } from "@/lib/domain";

const NAV: Record<Role, Array<{ href: string; label: string }>> = {
  employee: [
    { href: "/app", label: "Home" },
    { href: "/app/passport", label: "My Passport" },
    { href: "/app/profile", label: "Edit profile" },
    { href: "/app/matches", label: "Matches" },
  ],
  employer: [
    { href: "/app/employer", label: "Company and jobs" },
    { href: "/app/employer/jobs/new", label: "Post a job" },
  ],
  mentor: [{ href: "/app", label: "Home" }],
};

export function AppShell({ profile, children }: { profile: CurrentProfile; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b bg-background print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
          <Link href={profile.role === "employer" ? "/app/employer" : "/app"} className="text-2xl font-bold text-green">
            ConnectAble
          </Link>
          <nav aria-label="App">
            <ul className="flex flex-wrap gap-1">
              {NAV[profile.role].map((item) => (
                <li key={item.href}>
                  <Button variant="ghost" render={<Link href={item.href} />}>
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm sm:inline">{profile.fullName || "You"}</span>
            <RoleBadge role={profile.role} />
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {children}
      </main>
    </>
  );
}
