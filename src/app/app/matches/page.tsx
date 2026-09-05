import Link from "next/link";
import { MapPin } from "lucide-react";
import { BreakdownList } from "@/components/match/breakdown-list";
import { FeedbackButtons } from "@/components/match/feedback-buttons";
import { MatchRing } from "@/components/match/match-ring";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMatchesForEmployee } from "@/lib/data/matches";
import { requireRole } from "@/lib/data/profile";
import { REMOTE_LABEL } from "@/lib/sample";

export const metadata = { title: "Matches" };

export default async function MatchesPage() {
  const { userId } = await requireRole("employee");
  const matches = await getMatchesForEmployee(userId);

  return (
    <>
      <PageHeader title="Your matches" description="Ranked by how well the job and your Passport line up." />
      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <p className="font-bold">No matches yet.</p>
            <p className="text-muted-foreground">Publish your Passport and add your abilities so employers can find you.</p>
            <Button render={<Link href="/app/passport" />}>Go to my Passport</Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {matches.map((m) => (
            <li key={m.matchId}>
              <Card>
                <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
                  <MatchRing score={m.score} />
                  <div className="flex flex-col gap-2">
                    <div>
                      <h2 className="text-xl font-bold">{m.job.title}</h2>
                      <p className="text-muted-foreground">{m.companyName}</p>
                    </div>
                    <p className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden="true" className="size-4" /> {[m.job.city, m.job.state].filter(Boolean).join(", ") || "Location to be confirmed"}
                      </span>
                      <span>{REMOTE_LABEL[m.job.remote]}</span>
                      {m.job.salary_min != null && (
                        <span>
                          ${m.job.salary_min}
                          {m.job.salary_max != null && m.job.salary_max !== m.job.salary_min ? `–$${m.job.salary_max}` : ""} / hour
                        </span>
                      )}
                    </p>
                    {m.job.description && <p>{m.job.description}</p>}
                    {m.theirFeedback === "interested" && (
                      <p className="w-fit rounded-full bg-yellow-soft px-3 py-1 text-sm font-bold text-yellow-foreground">They&apos;re interested in you</p>
                    )}
                    <details className="text-sm">
                      <summary className="cursor-pointer font-bold">Why {m.score}%?</summary>
                      <div className="mt-3 max-w-sm">
                        <BreakdownList breakdown={m.breakdown} />
                      </div>
                    </details>
                  </div>
                  <FeedbackButtons matchId={m.matchId} current={m.myFeedback} back="/app/matches" vertical />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
