import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  HISTORY_KINDS,
  historyItemSchema,
  remotePreferenceSchema,
  type EmployeePrivate,
  type EmployeeProfile,
  type HistoryItem,
} from "@/lib/domain";
import { canPublish, summarizeStatus } from "./profile-status";
import { makePassportSlug, parseList } from "./text";

/**
 * ElevenLabs client tools for the Passport Guide agent.
 *
 * Every tool runs in the browser with the signed-in user's Supabase session,
 * so RLS guarantees it can only touch that user's rows. Tools never throw:
 * they return a short string the agent can read back, and on failure a
 * message starting with "Error:" so the agent can apologise and retry.
 *
 * Names and parameter identifiers here MUST match the dashboard config in
 * docs/agent/passport-guide.md (case-sensitive).
 */

type ToolFn = (parameters: Record<string, unknown>) => Promise<string>;
export type PassportClientTools = Record<string, ToolFn>;

const PROFILE_COLUMNS =
  "user_id, headline, about, about_raw, city, state, remote_preference, availability, abilities, accommodations, awards, education, volunteer, resume_path, video_path, passport_slug, passport_public, searchable";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

const basicsSchema = z.object({
  headline: optionalText(120),
  city: optionalText(80),
  state: optionalText(2).transform((v) => v?.toUpperCase()),
  remote_preference: remotePreferenceSchema.optional(),
});

const historySchema = z.object({
  kind: z.enum(HISTORY_KINDS),
  title: z.string().trim().min(1).max(120),
  org: optionalText(120),
  year: optionalText(20),
  details: optionalText(300),
});

const salarySchema = z
  .object({
    salary_min: z.coerce.number().min(0).max(999999),
    salary_max: z.coerce.number().min(0).max(999999),
  })
  .transform((v) =>
    v.salary_min <= v.salary_max
      ? v
      : { salary_min: v.salary_max, salary_max: v.salary_min },
  );

function errorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return `Error: ${msg}. Please try again.`;
}

export function buildPassportClientTools(
  supabase: SupabaseClient,
  userId: string,
  options: { siteUrl: string; fullName?: string | null },
): PassportClientTools {
  async function loadProfile(): Promise<{
    profile: EmployeeProfile | null;
    priv: Pick<EmployeePrivate, "salary_min" | "salary_max"> | null;
  }> {
    const [p, s] = await Promise.all([
      supabase
        .from("employee_profiles")
        .select(PROFILE_COLUMNS)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("employee_private")
        .select("salary_min, salary_max")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    return {
      profile: (p.data as unknown as EmployeeProfile) ?? null,
      priv: (s.data as EmployeePrivate | null) ?? null,
    };
  }

  async function status(): Promise<string> {
    const { profile, priv } = await loadProfile();
    return summarizeStatus(profile, priv);
  }

  async function upsertProfile(patch: Partial<EmployeeProfile>): Promise<string> {
    const { error } = await supabase
      .from("employee_profiles")
      .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
    if (error) throw error;
    return `Saved. ${await status()}`;
  }

  return {
    get_profile_status: async () => {
      try {
        return await status();
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_basics: async (parameters) => {
      try {
        const patch = basicsSchema.parse(parameters);
        const clean = Object.fromEntries(
          Object.entries(patch).filter(([, v]) => v !== undefined),
        );
        if (Object.keys(clean).length === 0) return "Nothing to save yet.";
        return await upsertProfile(clean);
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_abilities: async (parameters) => {
      try {
        const abilities = parseList(String(parameters.abilities ?? ""));
        if (abilities.length === 0) return "Error: no abilities were given.";
        return await upsertProfile({ abilities });
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_accommodations: async (parameters) => {
      try {
        const accommodations = parseList(String(parameters.accommodations ?? ""));
        if (accommodations.length === 0) {
          return "Error: no accommodations were given.";
        }
        return await upsertProfile({ accommodations });
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_availability: async (parameters) => {
      try {
        const availability = parseList(String(parameters.availability ?? ""));
        if (availability.length === 0) return "Error: no availability was given.";
        return await upsertProfile({ availability });
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_story: async (parameters) => {
      try {
        const about_raw = String(parameters.about_raw ?? "").trim().slice(0, 2000);
        const about = String(parameters.about ?? "").trim().slice(0, 1000);
        if (!about) return "Error: the professional version is empty.";
        return await upsertProfile({ about_raw, about });
      } catch (e) {
        return errorMessage(e);
      }
    },

    add_history: async (parameters) => {
      try {
        const { kind, ...rest } = historySchema.parse(parameters);
        const item: HistoryItem = historyItemSchema.parse(rest);
        const column = (
          { award: "awards", education: "education", volunteer: "volunteer" } as const
        )[kind];
        const { profile } = await loadProfile();
        const existing = (profile?.[column] ?? []) as HistoryItem[];
        return await upsertProfile({ [column]: [...existing, item] });
      } catch (e) {
        return errorMessage(e);
      }
    },

    save_salary: async (parameters) => {
      try {
        const range = salarySchema.parse(parameters);
        const { error } = await supabase
          .from("employee_private")
          .upsert({ user_id: userId, ...range }, { onConflict: "user_id" });
        if (error) throw error;
        return `Saved privately. ${await status()}`;
      } catch (e) {
        return errorMessage(e);
      }
    },

    finish_onboarding: async () => {
      try {
        const { profile, priv } = await loadProfile();
        if (!canPublish(profile, priv)) {
          return "Error: basics and abilities must be saved before publishing.";
        }
        let slug = profile?.passport_slug ?? null;
        if (!slug) {
          // A collision is a 1-in-800k event per try; two tries is plenty.
          for (let attempt = 0; attempt < 2 && !slug; attempt++) {
            const candidate = makePassportSlug(options.fullName);
            const { error } = await supabase
              .from("employee_profiles")
              .update({ passport_slug: candidate })
              .eq("user_id", userId);
            if (!error) slug = candidate;
            else if (!error.message.toLowerCase().includes("unique")) throw error;
          }
          if (!slug) throw new Error("could not create a Passport link");
        }
        const { error } = await supabase
          .from("employee_profiles")
          .update({ passport_public: true, searchable: true })
          .eq("user_id", userId);
        if (error) throw error;
        return `Published. The Passport link is ${options.siteUrl}/p/${slug}`;
      } catch (e) {
        return errorMessage(e);
      }
    },
  };
}
