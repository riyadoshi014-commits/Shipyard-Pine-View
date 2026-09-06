import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/data/profile";

// Audit F5 — the signed-in app is not for search indexes. Covers every
// /app/** route; a page-level metadata.robots would override this.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return <AppShell profile={profile}>{children}</AppShell>;
}
