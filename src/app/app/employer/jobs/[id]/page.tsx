import Link from "next/link";
import { notFound } from "next/navigation";
import { JobForm } from "@/components/employer/job-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/data/profile";
import type { Job } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("*").eq("id", id).eq("employer_id", userId).maybeSingle();
  if (!job) notFound();
  const j = job as Job;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader kicker="Edit job" title={`Edit: ${j.title}`}>
        <Button variant="outline" render={<Link href={`/app/employer/jobs/${j.id}/candidates`} />}>
          Candidates
        </Button>
      </PageHeader>
      <JobForm
        job={{ ...j, salary_min: j.salary_min == null ? null : Number(j.salary_min), salary_max: j.salary_max == null ? null : Number(j.salary_max) }}
        defaults={{ city: j.city, state: j.state, accommodations_offered: j.accommodations_offered }}
      />
    </div>
  );
}
