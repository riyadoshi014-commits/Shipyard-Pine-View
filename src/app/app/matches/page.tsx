import { MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BreakdownList } from "@/components/match/breakdown-list";
import { MatchRing } from "@/components/match/match-ring";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EMPLOYER, MATCHES, ME, REMOTE_LABEL } from "@/lib/sample";

export const metadata = { title: "Matches" };

export default function MatchesPage() {
  const mine = MATCHES.filter((m) => m.employee.id === ME.id);
  return (
    <AppShell persona="employee">
      <PageHeader title="Your matches" description="Ranked by how well the job and your Passport line up." />
      <ul className="flex flex-col gap-4">
        {mine.map((m) => (
          <li key={m.id}>
            <Card>
              <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
                <MatchRing score={m.score} />
                <div className="flex flex-col gap-2">
                  <div>
                    <h2 className="text-xl font-bold">{m.job.title}</h2>
                    <p className="text-muted-foreground">{EMPLOYER.company_name}</p>
                  </div>
                  <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-4" /> {m.job.city}, {m.job.state}
                    </span>
                    <span>{REMOTE_LABEL[m.job.remote]}</span>
                    <span>
                      ${m.job.salary_min}–${m.job.salary_max} / hour
                    </span>
                  </p>
                  <p>{m.job.description}</p>
                  {m.employerFeedback === "interested" && (
                    <p className="w-fit rounded-full bg-yellow-soft px-3 py-1 text-sm font-bold text-yellow-foreground">
                      They&apos;re interested in you
                    </p>
                  )}
                  <details className="text-sm">
                    <summary className="cursor-pointer font-bold">Why {m.score}%?</summary>
                    <div className="mt-3 max-w-sm">
                      <BreakdownList breakdown={m.breakdown} />
                    </div>
                  </details>
                </div>
                <div className="flex flex-row gap-2 md:flex-col">
                  <Button type="button">I&apos;m interested</Button>
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
