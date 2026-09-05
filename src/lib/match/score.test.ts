import { describe, expect, it } from "vitest";
import { computeMatchRows, coverage, scoreMatch, type EmployeeForMatch, type JobForMatch } from "./score";

const employee: EmployeeForMatch = {
  user_id: "e1",
  abilities: ["Stocking shelves", "Greeting customers"],
  accommodations: ["Written instructions"],
  availability: ["Weekday mornings", "Saturdays"],
  city: "Sarasota",
  state: "FL",
  remote_preference: "either",
};

const job: JobForMatch = {
  id: "j1",
  abilities_required: ["stocking shelves", "greeting customers"],
  accommodations_offered: ["written instructions", "quiet workspace"],
  availability: ["Weekday mornings"],
  city: "Sarasota",
  state: "FL",
  remote: "in_person",
  salary_min: 15,
  salary_max: 18,
};

describe("coverage", () => {
  it("is case-insensitive and ignores placeholder entries", () => {
    expect(coverage(["A", "b"], ["a", "B", "c"])).toBe(1);
    expect(coverage(["none listed yet"], [])).toBe(1);
    expect(coverage(["a", "b"], ["a"])).toBe(0.5);
  });
});

describe("scoreMatch", () => {
  it("gives 100 for a perfect fit", () => {
    const { score, breakdown } = scoreMatch(employee, { salary_min: 15, salary_max: 20 }, job);
    expect(breakdown).toEqual({ abilities: 40, accommodations: 25, location: 15, availability: 10, salary: 10 });
    expect(score).toBe(100);
  });

  it("scores partial abilities and unsupported accommodations", () => {
    const { breakdown } = scoreMatch(
      { ...employee, abilities: ["Stocking shelves"], accommodations: ["Job coach visits"] },
      null,
      job,
    );
    expect(breakdown.abilities).toBe(20);
    expect(breakdown.accommodations).toBe(0);
  });

  it("gives half salary credit when a side has no range, zero when ranges miss", () => {
    expect(scoreMatch(employee, null, job).breakdown.salary).toBe(5);
    expect(scoreMatch(employee, { salary_min: 25, salary_max: 30 }, job).breakdown.salary).toBe(0);
  });

  it("handles remote rules", () => {
    expect(scoreMatch({ ...employee, remote_preference: "remote" }, null, job).breakdown.location).toBe(0);
    expect(scoreMatch({ ...employee, remote_preference: "remote" }, null, { ...job, remote: "either" }).breakdown.location).toBe(15);
    expect(scoreMatch({ ...employee, city: "Tampa" }, null, job).breakdown.location).toBe(8);
    expect(scoreMatch({ ...employee, state: "GA" }, null, job).breakdown.location).toBe(0);
  });
});

describe("computeMatchRows", () => {
  it("produces one row per job and employee", () => {
    const rows = computeMatchRows([job, { ...job, id: "j2" }], [employee, { ...employee, user_id: "e2" }], new Map());
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ job_id: "j1", employee_id: "e1" });
  });
});
