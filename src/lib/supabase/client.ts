import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Safe to call in Client Components.
 * Uses the publishable key, so RLS governs every query.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
