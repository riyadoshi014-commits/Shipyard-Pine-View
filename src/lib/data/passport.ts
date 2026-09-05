import "server-only";
import type { HistoryItem, RemotePreference } from "@/lib/domain";
import type { SampleEmployee } from "@/lib/sample";
import { createClient } from "@/lib/supabase/server";

/** What the PassportCard renders. Never carries accommodations or pay to the public page. */
export type PassportView = SampleEmployee;

const PUBLIC_COLUMNS =
  "user_id, passport_slug, headline, about, about_raw, city, state, remote_preference, abilities, accommodations, availability, awards, education, volunteer, passport_public, profiles(full_name)";

type Row = {
  user_id: string;
  passport_slug: string | null;
  headline: string;
  about: string;
  about_raw: string;
  city: string;
  state: string;
  remote_preference: RemotePreference;
  abilities: string[] | null;
  accommodations: string[] | null;
  availability: string[] | null;
  awards: HistoryItem[] | null;
  education: HistoryItem[] | null;
  volunteer: HistoryItem[] | null;
  passport_public: boolean;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

function toView(row: Row, includeAccommodations: boolean): PassportView & { isPublic: boolean } {
  const owner = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.user_id,
    slug: row.passport_slug ?? "",
    fullName: owner?.full_name ?? "",
    headline: row.headline,
    about: row.about,
    aboutRaw: row.about_raw,
    city: row.city,
    state: row.state,
    remotePreference: row.remote_preference,
    abilities: row.abilities ?? [],
    accommodations: includeAccommodations ? (row.accommodations ?? []) : [],
    availability: row.availability ?? [],
    awards: row.awards ?? [],
    education: row.education ?? [],
    volunteer: row.volunteer ?? [],
    salaryMin: null,
    salaryMax: null,
    isPublic: row.passport_public,
  };
}

/** Anyone, including anonymous visitors, can read a published Passport. RLS enforces passport_public. */
export async function getPublicPassport(slug: string): Promise<PassportView | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("employee_profiles")
    .select(PUBLIC_COLUMNS)
    .eq("passport_slug", slug)
    .eq("passport_public", true)
    .maybeSingle();
  return data ? toView(data as unknown as Row, false) : null;
}

/** The owner's own Passport, published or not. */
export async function getOwnPassport(userId: string): Promise<(PassportView & { isPublic: boolean }) | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("employee_profiles").select(PUBLIC_COLUMNS).eq("user_id", userId).maybeSingle();
  return data ? toView(data as unknown as Row, true) : null;
}
