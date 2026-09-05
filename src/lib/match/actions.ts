"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";

/**
 * Quick reaction to a match. Each side writes its own row in match_feedback,
 * so neither side can change the other's answer; RLS checks participation.
 */
export async function giveFeedback(formData: FormData): Promise<void> {
  const matchId = String(formData.get("match_id") ?? "");
  const value = formData.get("value");
  const back = String(formData.get("back") ?? "/app");
  if (!matchId || (value !== "interested" && value !== "not_now")) return;

  const { userId } = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("match_feedback")
    .upsert({ match_id: matchId, user_id: userId, value }, { onConflict: "match_id,user_id" });
  revalidatePath(back.startsWith("/") ? back : "/app");
}
