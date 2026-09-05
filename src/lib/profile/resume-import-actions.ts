"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/data/profile";
import type { HistoryItem } from "@/lib/domain";
import type { ParsedResume } from "@/lib/resume-parse";
import { createClient } from "@/lib/supabase/server";

/**
 * Applies a parsed resume to the signed-in employee's own profile, merging
 * rather than overwriting: new abilities are added to the existing list
 * (deduped), new history items are appended, and only fields the parser
 * actually returned are touched.
 *
 * This is called only after the person has seen the extracted fields and
 * chosen to keep them (see src/components/profile/resume-import.tsx) --
 * nothing here writes automatically from a parse.
 */
export async function applyParsedResume(parsed: ParsedResume): Promise<{ error?: string; success?: string }> {
  const { userId } = await requireRole("employee");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("employee_profiles")
    .select("abilities, awards, education, volunteer")
    .eq("user_id", userId)
    .maybeSingle();

  const patch: Record<string, unknown> = {};
  if (parsed.headline) patch.headline = parsed.headline;
  if (parsed.city) patch.city = parsed.city;
  if (parsed.state) patch.state = parsed.state;
  if (parsed.about) patch.about = parsed.about;

  if (parsed.abilities.length > 0) {
    const current = new Set((existing?.abilities as string[] | undefined) ?? []);
    for (const a of parsed.abilities) current.add(a);
    patch.abilities = [...current];
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await supabase.from("employee_profiles").upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) return { error: "Could not save those details. Please try again." };
  }

  if (parsed.history.length > 0) {
    const buckets: Record<"award" | "education" | "volunteer", HistoryItem[]> = {
      award: ((existing?.awards as HistoryItem[] | undefined) ?? []).slice(),
      education: ((existing?.education as HistoryItem[] | undefined) ?? []).slice(),
      volunteer: ((existing?.volunteer as HistoryItem[] | undefined) ?? []).slice(),
    };
    for (const item of parsed.history) {
      buckets[item.kind].push({ title: item.title, org: item.org, year: item.year, details: item.details });
    }
    const { error } = await supabase
      .from("employee_profiles")
      .update({ awards: buckets.award, education: buckets.education, volunteer: buckets.volunteer })
      .eq("user_id", userId);
    if (error) return { error: "Saved some details, but not your history. Please try again." };
  }

  revalidatePath("/app/profile");
  return { success: "Added those details to your profile." };
}
