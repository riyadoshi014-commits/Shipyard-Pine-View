import type { RemotePreference } from "@/lib/domain";

export type EmployeeForMatch = {
  user_id: string;
  abilities: string[];
  accommodations: string[];
  availability: string[];
  city: string;
  state: string;
  remote_preference: RemotePreference;
};
export type SalaryForMatch = { salary_min: number | null; salary_max: number | null } | null;
export type JobForMatch = {
  id: string;
  abilities_required: string[];
  accommodations_offered: string[];
  availability: string[];
  city: string;
  state: string;
  remote: RemotePreference;
  salary_min: number | null;
  salary_max: number | null;
};
export type Breakdown = {
  abilities: number;
  accommodations: number;
  location: number;
  availability: number;
  salary: number;
};
export type MatchRow = { job_id: string; employee_id: string; score: number; breakdown: Breakdown };

/** Spec §4 weights. The % must be explainable, so every factor is a plain count. */
export const WEIGHTS: Breakdown = { abilities: 40, accommodations: 25, location: 15, availability: 10, salary: 10 };
export const FACTOR_LABELS: Record<keyof Breakdown, string> = {
  abilities: "Abilities match",
  accommodations: "Accommodations covered",
  location: "Location and remote",
  availability: "Availability",
  salary: "Pay range",
};

const PLACEHOLDERS = new Set(["none", "none listed yet", "n/a", "no", "nothing"]);
const norm = (s: string) => s.trim().toLowerCase();
const meaningful = (list: string[]) => list.map(norm).filter((s) => s && !PLACEHOLDERS.has(s));

/** Share of `need` present in `have`, case-insensitive. An empty need is fully covered. */
export function coverage(need: string[], have: string[]): number {
  const n = meaningful(need);
  if (n.length === 0) return 1;
  const h = new Set(meaningful(have));
  return n.filter((x) => h.has(x)).length / n.length;
}

function locationPoints(e: EmployeeForMatch, job: JobForMatch): number {
  const wantsRemote = e.remote_preference === "remote";
  const okWithRemote = e.remote_preference !== "in_person";
  if (job.remote === "remote") return okWithRemote ? WEIGHTS.location : 0;
  if (job.remote === "either" && wantsRemote) return WEIGHTS.location;
  if (wantsRemote) return 0;
  const sameState = Boolean(norm(e.state)) && norm(e.state) === norm(job.state);
  const sameCity = sameState && Boolean(norm(e.city)) && norm(e.city) === norm(job.city);
  if (sameCity) return WEIGHTS.location;
  if (sameState) return Math.round(WEIGHTS.location / 2);
  return 0;
}

/** Unknown pay on either side earns half credit so an unfinished profile is not punished. */
function salaryPoints(s: SalaryForMatch, job: JobForMatch): number {
  const half = WEIGHTS.salary / 2;
  const eMin = s?.salary_min ?? null;
  const eMax = s?.salary_max ?? null;
  if (eMin == null && eMax == null) return half;
  if (job.salary_min == null && job.salary_max == null) return half;
  const lo = Math.max(eMin ?? -Infinity, job.salary_min ?? -Infinity);
  const hi = Math.min(eMax ?? Infinity, job.salary_max ?? Infinity);
  return lo <= hi ? WEIGHTS.salary : 0;
}

export function scoreMatch(employee: EmployeeForMatch, salary: SalaryForMatch, job: JobForMatch) {
  const breakdown: Breakdown = {
    abilities: Math.round(coverage(job.abilities_required, employee.abilities) * WEIGHTS.abilities),
    accommodations: Math.round(coverage(employee.accommodations, job.accommodations_offered) * WEIGHTS.accommodations),
    location: locationPoints(employee, job),
    availability: Math.round(coverage(job.availability, employee.availability) * WEIGHTS.availability),
    salary: salaryPoints(salary, job),
  };
  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, breakdown };
}

export function computeMatchRows(
  jobs: JobForMatch[],
  employees: EmployeeForMatch[],
  salaries: Map<string, SalaryForMatch>,
): MatchRow[] {
  const rows: MatchRow[] = [];
  for (const job of jobs) {
    for (const employee of employees) {
      const { score, breakdown } = scoreMatch(employee, salaries.get(employee.user_id) ?? null, job);
      rows.push({ job_id: job.id, employee_id: employee.user_id, score, breakdown });
    }
  }
  return rows;
}
