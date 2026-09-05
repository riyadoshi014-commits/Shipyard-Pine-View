import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS. Server only, and only for jobs that
 * legitimately need cross-user access: the match scorer (reads
 * employee_private salary ranges) and the seed script.
 *
 * Never import this from a Client Component or pass its output to one.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL must be set on the server.",
    );
  }
  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
