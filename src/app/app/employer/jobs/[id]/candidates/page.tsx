import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, Minus } from "lucide-react";
import { NativeSelect } from "@/components/form/native-select";
import { FeedbackButtons } from "@/components/match/feedback-buttons";
import { MatchRing } from "@/components/match/match-ring";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCandidatesForJob, type CandidateMatch } from "@/lib/data/matches";
import { requireRole } from "@/lib/data/profile";
import type { Job } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Candidates" };

type Filters = { state?: string; remote?: string; ability?: string };

function applyFilters(list: CandidateMatch[], f: Filters): CandidateMatch[] {
  const ability = f.ability?.trim().toLowerCase();
  return list.filter((c) => {
    if (f.state && c.state !== f.state) return false;
    if (f.remote && c.remotePreference !== f.remote && c.remotePreference !== "either") return false;
    if (ability && !c.abilities.some((a) => a.toLowerCase().includes(ability))) return false;
    return true;
  });
}

export default async function CandidatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Filters>;
}) {
  const { id } = await params;
  const filters = await searchParams;
  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("employer_id", userId).maybeSingle();
  if (!job) notFound();
  const j = job as Job;

  const all = await getCandidatesForJob(j.id, userId);
  const candidates = applyFilters(all, filters);
  const offered = new Set(j.accommodations_offered.map((a) => a.toLowerCase()));
  const states = [...new Set(all.map((c) => c.state).filter(Boolean))].sort();
  const back = `/app/employer/jobs/${j.id}/candidates`;

  return (
    <>
      <PageHeader
        kicker="Candidates"
        title={`Candidates for ${j.title}`}
        description={`${all.length} ${all.length === 1 ? "person" : "people"}, ranked by fit. Accommodations they need are checked when this job offers them.`}
      >
        <Button variant="outline" render={<Link href="/app/employer" />}>
          All jobs
        </Button>
        <Button variant="outline" render={<Link href={`/app/employer/jobs/${j.id}`} />}>
          Edit job
        </Button>
      </PageHeader>

      <form
        method="get"
        className="mb-6 grid gap-3 rounded-2xl border bg-card p-4 shadow-[var(--ap-shadow-md)] sm:grid-cols-[1fr_1fr_1fr_auto]"
        aria-label="Filters"
      >
        <div>
          <label htmlFor="f-state" className="mb-1 block text-sm font-bold">
            State
          </label>
          <NativeSelect id="f-state" name="state" defaultValue={filters.state ?? ""}>
            <option value="">Any</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-remote" className="mb-1 block text-sm font-bold">
            Where
          </label>
          <NativeSelect id="f-remote" name="remote" defaultValue={filters.remote ?? ""}>
            <option value="">Any</option>
            <option value="in_person">In person</option>
            <option value="remote">Remote</option>
          </NativeSelect>
        </div>
        <div>
          <label htmlFor="f-ability" className="mb-1 block text-sm font-bold">
            Ability
          </label>
          <Input id="f-ability" name="ability" defaultValue={filters.ability ?? ""} placeholder="e.g. greeting" />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="outline">
            Apply
          </Button>
          <Button variant="ghost" render={<Link href={back} />}>
            Clear
          </Button>
        </div>
      </form>

      {candidates.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-muted-foreground">
          {all.length === 0
            ? "No candidates yet. Job seekers appear here as soon as they publish a Passport."
            : "No one matches those filters. Try clearing them."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {candidates.map((c) => (
            <li key={c.matchId}>
              <Card
                className={`ap-fade ap-accent ${
                  c.score >= 75 ? "ap-accent-green" : c.score >= 50 ? "ap-accent-yellow" : "ap-accent-muted"
                }`}
              >
                <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto]">
                  <MatchRing score={c.score} />
                  <div className="flex flex-col gap-3">
                    <div>
                      <h2 className="text-xl font-bold">
                        <Link href={`${back}/${c.employeeId}`} className="hover:underline">
                          {c.fullName}
                        </Link>
                      </h2>
                      {c.headline && <p>{c.headline}</p>}
                      {(c.city || c.state) && (
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin aria-hidden="true" className="size-4" /> {[c.city, c.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <ul aria-label="Abilities" className="flex flex-wrap gap-2">
                      {c.abilities.map((a) => {
                        const needed = j.abilities_required.some((r) => r.toLowerCase() === a.toLowerCase());
                        return (
                          <li key={a} className={needed ? "rounded-full bg-green-soft px-3 py-1 text-sm font-bold text-green" : "rounded-full border px-3 py-1 text-sm"}>
                            {a}
                          </li>
                        );
                      })}
                    </ul>
                    {c.accommodations.length > 0 && (
                      <ul aria-label="Accommodations" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        {c.accommodations.map((a) => {
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
                    )}
                    {c.theirFeedback === "interested" && (
                      <p className="w-fit rounded-full bg-yellow-soft px-3 py-1 text-sm font-bold text-yellow-foreground">Interested in this job</p>
                    )}
                  </div>
                  <FeedbackButtons matchId={c.matchId} current={c.myFeedback} back={back} vertical />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
