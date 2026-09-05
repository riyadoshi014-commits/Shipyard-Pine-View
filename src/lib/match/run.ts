import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeMatchRows, type EmployeeForMatch, type JobForMatch, type SalaryForMatch } from "./score";

export type MatchScope = { employeeId?: string; jobIds?: string[] };

const num = (v: unknown) => (v == null ? null : Number(v));

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

/** Best-effort wrapper for server actions: a matching failure never fails a save. */
export async function tryRunMatching(scope: MatchScope = {}): Promise<void> {
  try {
    await runMatching(scope);
  } catch (e) {
    console.error("matching failed", e);
  }
}
