import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatchRows, type EmployeeForMatch, type JobForMatch, type SalaryForMatch } from "./score";

export type MatchScope = { employeeId?: string; jobIds?: string[] };

const num = (v: unknown) => (v == null ? null : Number(v));

/**
 * Supabase client errors (PostgrestError, AuthError, StorageError, ...) are
 * plain objects with a `.message` string -- they are NOT `instanceof Error`.
 * `e instanceof Error ? e.message : String(e)` therefore always falls to
 * `String(e)` for them, which stringifies to "[object Object]" and loses
 * the actual message text. That silently broke the credential-rejection
 * diagnostic below: the pattern match never saw the real "Invalid API key"
 * text, so the specific, actionable error never fired -- only the generic
 * fallback did. This checks for a `.message` string on any object shape
 * before falling back to String(e).
 */
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return String(e);
}

/**
 * Recomputes and upserts match rows. Runs with the service role because it
 * must read employee_private (pay ranges) across users. Only the score and
 * breakdown are stored; the inputs never leave this function.
 */
export async function runMatching(scope: MatchScope = {}): Promise<number> {
  if (scope.jobIds && scope.jobIds.length === 0) return 0;
  const admin = createAdminClient();

  let jobsQuery = admin
    .from("jobs")
    .select("id, abilities_required, accommodations_offered, availability, city, state, remote, salary_min, salary_max")
    .eq("status", "open");
  if (scope.jobIds) jobsQuery = jobsQuery.in("id", scope.jobIds);

  let employeesQuery = admin
    .from("employee_profiles")
    .select("user_id, abilities, accommodations, availability, city, state, remote_preference")
    .eq("searchable", true);
  if (scope.employeeId) employeesQuery = employeesQuery.eq("user_id", scope.employeeId);

  const [{ data: jobsData, error: jobsError }, { data: employeesData, error: employeesError }] = await Promise.all([
    jobsQuery,
    employeesQuery,
  ]);
  if (jobsError) throw jobsError;
  if (employeesError) throw employeesError;
  if (!jobsData?.length || !employeesData?.length) return 0;

  const jobs = jobsData.map((j) => ({ ...j, salary_min: num(j.salary_min), salary_max: num(j.salary_max) })) as JobForMatch[];
  const employees = employeesData as EmployeeForMatch[];

  const { data: salaries, error: salaryError } = await admin
    .from("employee_private")
    .select("user_id, salary_min, salary_max")
    .in("user_id", employees.map((e) => e.user_id));
  if (salaryError) throw salaryError;
  const salaryMap = new Map<string, SalaryForMatch>(
    (salaries ?? []).map((s) => [s.user_id as string, { salary_min: num(s.salary_min), salary_max: num(s.salary_max) }]),
  );

  const rows = computeMatchRows(jobs, employees, salaryMap);
  const { error } = await admin.from("matches").upsert(rows, { onConflict: "job_id,employee_id" });
  if (error) throw error;
  return rows.length;
}

/**
 * Removes match rows that should no longer exist. `runMatching` only ever
 * upserts (open jobs x searchable employees), so without this a passport that
 * is unpublished, or a job that is closed, keeps its stale rows and keeps
 * showing up in the other side's list.
 */
export async function clearMatches(scope: MatchScope): Promise<void> {
  const admin = createAdminClient();
  try {
    if (scope.employeeId) {
      const { error } = await admin.from("matches").delete().eq("employee_id", scope.employeeId);
      if (error) throw error;
    }
    if (scope.jobIds?.length) {
      const { error } = await admin.from("matches").delete().in("job_id", scope.jobIds);
      if (error) throw error;
    }
  } catch (e) {
    console.error("clearMatches failed", scope, e);
  }
}

/** Best-effort wrapper for server actions: a matching failure never fails a save. */
export async function tryRunMatching(scope: MatchScope = {}): Promise<void> {
  try {
    const count = await runMatching(scope);
    if (count === 0) {
      console.warn(
        "matching produced 0 rows for",
        JSON.stringify(scope),
        "- expected when there are no open jobs or the profile is not searchable yet",
      );
    }
  } catch (e) {
    const message = errorMessage(e);
    if (/invalid api key|jwt|not authorized|permission denied/i.test(message)) {
      console.error(
        "matching failed: the Supabase service-role credential is being rejected. " +
          "Check SUPABASE_SECRET_KEY in .env against the current key in the Supabase " +
          "dashboard (Settings -> API Keys). Until this is fixed, publishing a Passport " +
          "will never create any matches.",
        e,
      );
    } else {
      console.error("matching failed", e);
    }
  }
}
