import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BreakdownList } from "@/components/match/breakdown-list";
import { MatchRing } from "@/components/match/match-ring";
import { PageHeader } from "@/components/page-header";
import { PassportCard } from "@/components/passport/passport-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JOBS, MATCHES } from "@/lib/sample";

export const metadata = { title: "Candidate" };

export default async function CandidatePage({ params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id, employeeId } = await params;
  const job = JOBS.find((j) => j.id === id) ?? JOBS[0];
  const match = MATCHES.find((m) => m.job.id === job.id && m.employee.id === employeeId) ?? MATCHES[0];
  const offered = new Set(job.accommodations_offered.map((a) => a.toLowerCase()));

  return (
    <AppShell persona="employer">
      <PageHeader title={match.employee.fullName} description={`Candidate for ${job.title}`}>
        <Button variant="outline" render={<Link href={`/app/employer/jobs/${job.id}/candidates`} />}>
          Back to candidates
        </Button>
      </PageHeader>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <PassportCard person={match.employee} />
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="items-center">
              <MatchRing score={match.score} size={96} />
            </CardHeader>
            <CardContent>
              <BreakdownList breakdown={match.breakdown} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Accommodations they need</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-sm">
                {match.employee.accommodations.map((a) => {
                  const ok = offered.has(a.toLowerCase());
                  return (
                    <li key={a} className="inline-flex items-center gap-2">
                      {ok ? <Check aria-hidden="true" className="size-4 text-green" /> : <Minus aria-hidden="true" className="size-4 text-muted-foreground" />}
                      <span>
                        {a}
                        <span className="text-muted-foreground"> · {ok ? "you offer this" : "not on this job yet"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-2">
            <Button type="button" size="lg">
              I&apos;m interested
            </Button>
            <Button type="button" variant="outline">
              Not now
            </Button>
            <p className="text-xs text-muted-foreground">Mark interested and they will see it on their matches page. Messaging comes next.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
