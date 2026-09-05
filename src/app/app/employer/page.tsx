import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ChipPicker } from "@/components/chip-picker";
import { Field } from "@/components/form/field";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ACCOMMODATION_SUGGESTIONS, EMPLOYER, JOBS, MATCHES } from "@/lib/sample";

export const metadata = { title: "Company and jobs" };

export default function EmployerPage() {
  return (
    <AppShell persona="employer">
      <PageHeader title={EMPLOYER.company_name} description="Post a role and see who fits.">
        <Button render={<Link href="/app/employer/jobs/new" />}>Post a job</Button>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <section>
          <h2 className="mb-4 text-xl font-bold">Open jobs</h2>
          <ul className="flex flex-col gap-4">
            {JOBS.map((job) => {
              const candidates = MATCHES.filter((m) => m.job.id === job.id);
              const strong = candidates.filter((m) => m.score >= 75).length;
              return (
                <li key={job.id}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{job.title}</CardTitle>
                      <CardDescription>
                        {candidates.length} candidates · {strong} strong fit{strong === 1 ? "" : "s"} · ${job.salary_min}–$
                        {job.salary_max} / hour
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button render={<Link href={`/app/employer/jobs/${job.id}/candidates`} />}>See candidates</Button>
                      <Button variant="outline" render={<Link href="/app/employer/jobs/new" />}>
                        Edit
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Company profile</h2>
          <form action="/app/employer" className="flex flex-col gap-4">
            <Field id="company_name" label="Company name">
              <Input id="company_name" defaultValue={EMPLOYER.company_name} />
            </Field>
            <Field id="description" label="About the company">
              <Textarea id="description" rows={3} defaultValue={EMPLOYER.description} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City">
                <Input id="city" defaultValue={EMPLOYER.city} />
              </Field>
              <Field id="state" label="State">
                <Input id="state" defaultValue={EMPLOYER.state} />
              </Field>
            </div>
            <ChipPicker
              name="accommodations_offered"
              label="Accommodations we can provide"
              description="The matcher scores candidates for these, never against them."
              suggestions={ACCOMMODATION_SUGGESTIONS}
              initial={EMPLOYER.accommodations_offered}
            />
            <Button type="submit" size="lg" className="self-start">
              Save company
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
