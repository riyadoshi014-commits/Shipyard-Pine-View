"use server";

import { revalidatePath } from "next/cache";
import { makePassportSlug } from "@/lib/agent/text";
import { firstFieldErrors, type FormState } from "@/lib/auth/schemas";
import { requireRole } from "@/lib/data/profile";
import type { HistoryItem } from "@/lib/domain";
import { formToObject } from "@/lib/forms";
import { tryRunMatching } from "@/lib/match/run";
import { createClient } from "@/lib/supabase/server";
import { employeeProfileFormSchema, historyFormSchema, PROFILE_LIST_FIELDS } from "./schemas";

const HISTORY_COLUMN = { award: "awards", education: "education", volunteer: "volunteer" } as const;

export async function saveEmployeeProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = employeeProfileFormSchema.safeParse(formToObject(formData, PROFILE_LIST_FIELDS));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };
  const { salary_min, salary_max, ...profile } = parsed.data;

  const { userId } = await requireRole("employee");
  const supabase = await createClient();

  const { error } = await supabase.from("employee_profiles").upsert({ user_id: userId, ...profile }, { onConflict: "user_id" });
  if (error) return { error: "We couldn't save your profile. Please try again." };

  const { error: privError } = await supabase
    .from("employee_private")
    .upsert({ user_id: userId, salary_min, salary_max }, { onConflict: "user_id" });
  if (privError) return { error: "Saved your profile, but not the pay range. Please try again." };

  await tryRunMatching({ employeeId: userId });
  revalidatePath("/app/profile");
  revalidatePath("/app");
  return { success: "Saved." };
}

async function readHistory(userId: string, column: string): Promise<HistoryItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("employee_profiles").select(column).eq("user_id", userId).maybeSingle();
  return ((data as Record<string, HistoryItem[]> | null)?.[column] ?? []) as HistoryItem[];
}

export async function addHistoryItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = historyFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };
  const { kind, ...rest } = parsed.data;
  const item: HistoryItem = { title: rest.title, org: rest.org || undefined, year: rest.year || undefined, details: rest.details || undefined };

  const { userId } = await requireRole("employee");
  const column = HISTORY_COLUMN[kind];
  const existing = await readHistory(userId, column);
  const supabase = await createClient();
  const { error } = await supabase.from("employee_profiles").update({ [column]: [...existing, item] }).eq("user_id", userId);
  if (error) return { error: "We couldn't add that. Please try again." };
  revalidatePath("/app/profile");
  return { success: "Added." };
}

export async function removeHistoryItem(formData: FormData): Promise<void> {
  const kind = String(formData.get("kind")) as keyof typeof HISTORY_COLUMN;
  const index = Number(formData.get("index"));
  if (!(kind in HISTORY_COLUMN) || !Number.isInteger(index)) return;

  const { userId } = await requireRole("employee");
  const column = HISTORY_COLUMN[kind];
  const existing = await readHistory(userId, column);
  const supabase = await createClient();
  await supabase.from("employee_profiles").update({ [column]: existing.filter((_, i) => i !== index) }).eq("user_id", userId);
  revalidatePath("/app/profile");
}

export async function publishPassport(): Promise<void> {
  const { userId, fullName } = await requireRole("employee");
  const supabase = await createClient();
  const { data } = await supabase.from("employee_profiles").select("passport_slug").eq("user_id", userId).maybeSingle();
  let slug = data?.passport_slug ?? null;
  for (let attempt = 0; attempt < 3 && !slug; attempt++) {
    const candidate = makePassportSlug(fullName);
    const { error } = await supabase.from("employee_profiles").update({ passport_slug: candidate }).eq("user_id", userId);
    if (!error) slug = candidate;
  }
  await supabase.from("employee_profiles").update({ passport_public: true, searchable: true }).eq("user_id", userId);
  await tryRunMatching({ employeeId: userId });
  revalidatePath("/app/passport");
  revalidatePath("/app");
}

export async function unpublishPassport(): Promise<void> {
  const { userId } = await requireRole("employee");
  const supabase = await createClient();
  await supabase.from("employee_profiles").update({ passport_public: false, searchable: false }).eq("user_id", userId);
  revalidatePath("/app/passport");
  revalidatePath("/app");
}
