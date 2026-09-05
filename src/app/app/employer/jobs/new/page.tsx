import { JobForm } from "@/components/employer/job-form";
import { PageHeader } from "@/components/page-header";
import { requireRole } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("employer_profiles")
    .select("city, state, accommodations_offered")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Post a job" description="Describe the work in plain language. Candidates are matched on abilities, not titles." />
      <JobForm
        job={null}
        defaults={{
          city: company?.city ?? "",
          state: company?.state ?? "FL",
          accommodations_offered: company?.accommodations_offered ?? [],
        }}
      />
    </div>
  );
}
