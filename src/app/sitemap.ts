import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/**
 * Audit finding F3 (checklist T03 P0).
 *
 * Static public routes + one entry per PUBLISHED Ability Passport.
 * The DB read is wrapped so `next build` still succeeds with no Supabase env
 * (README: "the frontend runs without any keys").
 */
export const revalidate = 3600; // re-generate at most hourly

type ChangeFreq = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: ChangeFreq }> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  // Once the role-specific terms pages land, add:
  // { path: "/terms/employee", priority: 0.3, changeFrequency: "yearly" },
  // { path: "/terms/employer", priority: 0.3, changeFrequency: "yearly" },
  // { path: "/terms/mentor",   priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  let passportEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    // NOTE: verify the timestamp column against supabase/migrations. If
    // `employee_profiles` has no `updated_at`, drop it and use `now`.
    const { data } = await supabase
      .from("employee_profiles")
      .select("passport_slug, updated_at")
      .eq("passport_public", true)
      .not("passport_slug", "is", null);

    passportEntries = (data ?? []).map((row) => ({
      url: `${SITE_URL}/p/${row.passport_slug}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  } catch {
    // No Supabase env / table not reachable at build time — ship static only.
  }

  return [...staticEntries, ...passportEntries];
}
