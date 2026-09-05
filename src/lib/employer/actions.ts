"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { firstFieldErrors, type FormState } from "@/lib/auth/schemas";
import { requireRole } from "@/lib/data/profile";
import { formToObject } from "@/lib/forms";
import { tryRunMatching } from "@/lib/match/run";
import { createClient } from "@/lib/supabase/server";
import { EMPLOYER_LIST_FIELDS, employerProfileFormSchema, JOB_LIST_FIELDS, jobFormSchema } from "./schemas";

export async function saveEmployerProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = employerProfileFormSchema.safeParse(formToObject(formData, EMPLOYER_LIST_FIELDS));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };

  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  const { error } = await supabase
    .from("employer_profiles")
    .upsert({ user_id: userId, ...parsed.data, website: parsed.data.website || null }, { onConflict: "user_id" });
  if (error) return { error: "We couldn't save the company. Please try again." };
  revalidatePath("/app/employer");
  return { success: "Saved." };
}

export async function saveJob(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = jobFormSchema.safeParse(formToObject(formData, JOB_LIST_FIELDS));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };
  const { id, ...job } = parsed.data;

  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  let jobId = id;

  if (jobId) {
    const { error } = await supabase.from("jobs").update(job).eq("id", jobId).eq("employer_id", userId);
    if (error) return { error: "We couldn't update the job. Please try again." };
  } else {
    const { data, error } = await supabase
      .from("jobs")
      .insert({ ...job, employer_id: userId })
      .select("id")
      .single();
    if (error || !data) return { error: "We couldn't post the job. Please try again." };
    jobId = data.id as string;
  }

  await tryRunMatching({ jobIds: [jobId] });
  revalidatePath("/app/employer");
  redirect(`/app/employer/jobs/${jobId}/candidates`);
}

export async function setJobStatus(formData: FormData): Promise<void> {
  const jobId = String(formData.get("job_id") ?? "");
  const status = formData.get("status") === "closed" ? "closed" : "open";
  if (!jobId) return;
  const { userId } = await requireRole("employer");
  const supabase = await createClient();
  await supabase.from("jobs").update({ status }).eq("id", jobId).eq("employer_id", userId);
  if (status === "open") await tryRunMatching({ jobIds: [jobId] });
  revalidatePath("/app/employer");
}
