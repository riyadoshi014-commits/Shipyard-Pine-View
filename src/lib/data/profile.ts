import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/domain";

export type CurrentProfile = { userId: string; role: Role; fullName: string };

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (!profile) return null;
  return { userId, role: profile.role as Role, fullName: profile.full_name ?? "" };
}

export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireRole(role: Role): Promise<CurrentProfile> {
  const profile = await requireProfile();
  if (profile.role !== role) redirect("/app");
  return profile;
}

/** Where each role's home is; used after login and for role mismatches. */
export function homeFor(role: Role): string {
  return role === "employer" ? "/app/employer" : "/app";
}
