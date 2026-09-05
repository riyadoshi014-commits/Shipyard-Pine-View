import Link from "next/link";
import { EmployerProfileForm } from "@/components/employer/employer-profile-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/data/profile";
import type { EmployerProfile, Job } from "@/lib/domain";
import { setJobStatus } from "@/lib/employer/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Company and jobs" };

export default async function EmployerPage() {
  const { userId, fullName } = await requireRole("employer");
  const supabase = await createClient();
  const [{ data: company }, { data: jobs }] = await Promise.all([
    supabase.from("employer_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("jobs").select("*").eq("employer_id", userId).order("created_at", { ascending: false }),
  ]);
  const jobList = (jobs ?? []) as Job[];
  const counts = new Map<string, { total: number; strong: number }>();
  if (jobList.length) {
    const { data: matches } = await supabase.from("matches").select("job_id, score").in("job_id", jobList.map((j) => j.id));
    for (const m of matches ?? []) {
      const c = counts.get(m.job_id as string) ?? { total: 0, strong: 0 };
      c.total += 1;
      if ((m.score as number) >= 75) c.strong += 1;
      counts.set(m.job_id as string, c);
    }
  }

  return (
    <>
      <PageHeader
        title={company?.company_name || `Hi ${fullName.split(" ")[0] || "there"}`}
        description={company?.company_name ? "Post a role and see who fits." : "Start by telling job seekers who you are."}
      >
        <Button render={<Link href="/app/employer/jobs/new" />}>Post a job</Button>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-xl font-bold">Jobs</h2>
          {jobList.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-muted-foreground">No jobs yet. Post one and candidates are ranked for it right away.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {jobList.map((job) => {
                const c = counts.get(job.id) ?? { total: 0, strong: 0 };
                return (
                  <li key={job.id}>
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {job.title}
                          {job.status === "closed" && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-bold">Closed</span>}
                        </CardTitle>
                        <CardDescription>
                          {c.total} candidate{c.total === 1 ? "" : "s"} · {c.strong} strong fit{c.strong === 1 ? "" : "s"}
                          {job.salary_min != null && ` · $${job.salary_min}${job.salary_max != null ? `–$${job.salary_max}` : ""} / hour`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        <Button render={<Link href={`/app/employer/jobs/${job.id}/candidates`} />}>See candidates</Button>
                        <Button variant="outline" render={<Link href={`/app/employer/jobs/${job.id}`} />}>
                          Edit
                        </Button>
                        <form action={setJobStatus}>
                          <input type="hidden" name="job_id" value={job.id} />
                          <input type="hidden" name="status" value={job.status === "open" ? "closed" : "open"} />
                          <Button type="submit" variant="ghost">
                            {job.status === "open" ? "Close" : "Reopen"}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Company profile</h2>
          <EmployerProfileForm profile={(company as EmployerProfile | null) ?? null} />
        </section>
      </div>
    </>
  );
}
