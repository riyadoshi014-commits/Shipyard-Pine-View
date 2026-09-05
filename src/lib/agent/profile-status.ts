import type { EmployeePrivate, EmployeeProfile } from "@/lib/domain";

/**
 * The agent's view of a Passport: which sections are saved and which are
 * missing. Used both for the `profile_status` dynamic variable at session
 * start and as the return value of the `get_profile_status` client tool.
 */

export const SECTIONS = [
  "basics",
  "abilities",
  "accommodations",
  "availability",
  "story",
  "history",
  "pay",
] as const;
export type Section = (typeof SECTIONS)[number];

type ProfileLike = Partial<
  Pick<
    EmployeeProfile,
    | "headline"
    | "city"
    | "about"
    | "abilities"
    | "accommodations"
    | "availability"
    | "awards"
    | "education"
    | "volunteer"
  >
>;
type PrivateLike = Partial<Pick<EmployeePrivate, "salary_min">> | null;

export function savedSections(
  profile: ProfileLike | null,
  priv: PrivateLike,
): Section[] {
  if (!profile) return [];
  const saved: Section[] = [];
  if (profile.city?.trim() && profile.headline?.trim()) saved.push("basics");
  if ((profile.abilities?.length ?? 0) > 0) saved.push("abilities");
  if ((profile.accommodations?.length ?? 0) > 0) saved.push("accommodations");
  if ((profile.availability?.length ?? 0) > 0) saved.push("availability");
  if (profile.about?.trim()) saved.push("story");
  if (
    (profile.awards?.length ?? 0) +
      (profile.education?.length ?? 0) +
      (profile.volunteer?.length ?? 0) >
    0
  ) {
    saved.push("history");
  }
  if (priv?.salary_min != null) saved.push("pay");
  return saved;
}

/** Plain-language one-liner the agent can read and act on. */
export function summarizeStatus(
  profile: ProfileLike | null,
  priv: PrivateLike,
): string {
  const saved = savedSections(profile, priv);
  const missing = SECTIONS.filter((s) => !saved.includes(s));
  if (saved.length === 0) return "Nothing saved yet.";
  if (missing.length === 0) return "Everything is saved. Ready to finish.";
  return `Saved: ${saved.join(", ")}. Missing: ${missing.join(", ")}.`;
}

/** basics + abilities are the minimum for a useful, publishable Passport. */
export function canPublish(profile: ProfileLike | null, priv: PrivateLike): boolean {
  const saved = savedSections(profile, priv);
  return saved.includes("basics") && saved.includes("abilities");
}
