import Link from "next/link";
import { Check, MapPin, Minus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MatchRing } from "@/components/match/match-ring";
import { NativeSelect } from "@/components/form/native-select";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { JOBS, MATCHES } from "@/lib/sample";

export const metadata = { title: "Candidates" };

export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const candidates = MATCHES.filter((m) => m.job.id === job.id);
  const offered = new Set(job.accommodations_offered.map((a) => a.toLowerCase()));

  return (
    <AppShell persona="employer">
      <PageHeader title={`Candidates for ${job.title}`} description={`${candidates.length} people, ranked by fit. Accommodations they need are checked when you already offer them.`}>
        <Button variant="outline" render={<Link href="/app/employer" />}>
          All jobs
        </Button>
      </PageHeader>

      <form className="mb-6 grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]" aria-label="Filters">
        <div>
          <label htmlFor="f-state" className="mb-1 block text-sm font-bold">
            State
          </label>
          <NativeSelect id="f-state" defaultValue="FL">
            <option value="">Any</option>
            <option value="FL">FL</option>
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-remote" className="mb-1 block text-sm font-bold">
            Where
          </label>
          <NativeSelect id="f-remote" defaultValue="">
            <option value="">Any</option>
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-ability" className="mb-1 block text-sm font-bold">
            Ability
          </label>
          <input id="f-ability" className="h-11 w-full rounded-lg border border-input bg-background px-3" placeholder="e.g. greeting" />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline">
            Apply
          </Button>
        </div>
      </form>

      <ul className="flex flex-col gap-4">
        {candidates.map((m) => (
          <li key={m.id}>
            <Card>
              <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
                <MatchRing score={m.score} />
                <div className="flex flex-col gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      <Link href={`/app/employer/jobs/${job.id}/candidates/${m.employee.id}`} className="hover:underline">
                        {m.employee.fullName}
                      </Link>
                    </h2>
                    <p>{m.employee.headline}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="size-4" /> {m.employee.city}, {m.employee.state}
                    </p>
                  </div>
                  <ul aria-label="Abilities" className="flex flex-wrap gap-2">
                    {m.employee.abilities.map((a) => {
                      const needed = job.abilities_required.some((r) => r.toLowerCase() === a.toLowerCase());
                      return (
                        <li key={a} className={needed ? "rounded-full bg-green-soft px-3 py-1 text-sm font-bold text-green" : "rounded-full border px-3 py-1 text-sm"}>
                          {a}
                        </li>
                      );
                    })}
                  </ul>
                  <ul aria-label="Accommodations" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {m.employee.accommodations.map((a) => {
                      const ok = offered.has(a.toLowerCase());
                      return (
                        <li key={a} className="inline-flex items-center gap-1">
                          {ok ? <Check aria-hidden="true" className="size-4 text-green" /> : <Minus aria-hidden="true" className="size-4 text-muted-foreground" />}
                          <span className="sr-only">{ok ? "You offer:" : "Not offered yet:"}</span>
                          {a}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex flex-row gap-2 md:flex-col">
                  <Button type="button">Interested</Button>
                  <Button type="button" variant="outline">
                    Not now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
