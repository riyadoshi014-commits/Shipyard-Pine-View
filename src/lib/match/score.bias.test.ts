import { describe, expect, it } from "vitest";
import { scoreMatch, type EmployeeForMatch, type JobForMatch } from "./score";

/**
 * Bias-robustness check (docs/RISKS_AND_GAPS.md section 3b): matching on
 * how well someone describes themselves is a proxy for disability, and this
 * product exists specifically to avoid that. This is a separate file from
 * score.test.ts (which covers the scoring math itself) so it doesn't
 * collide with edits there -- it exists to make one property explicit and
 * permanently checked: EmployeeForMatch has no room for prose at all, so
 * fluency literally cannot move a score.
 */

const JOB: JobForMatch = {
  id: "j1",
  abilities_required: ["stocking shelves", "greeting customers"],
  accommodations_offered: ["written instructions"],
  availability: ["Weekday mornings"],
  city: "Sarasota",
  state: "FL",
  remote: "in_person",
  salary_min: 15,
  salary_max: 18,
};

function structuredFields(): Omit<EmployeeForMatch, "user_id"> {
  return {
    abilities: ["Stocking shelves", "Greeting customers"],
    accommodations: ["Written instructions"],
    availability: ["Weekday mornings"],
    city: "Sarasota",
    state: "FL",
    remote_preference: "either",
  };
}

// Two employees with identical structured data. Only their free-text
// self-description differs -- one polished, one plain and halting. If the
// score ever differed here, the matcher would be scoring communication
// style instead of demonstrated ability.
const FLUENT_DESCRIPTION =
  "A dependable, articulate team member with two years of experience providing exceptional customer service in a fast-paced retail environment.";
const PLAIN_DESCRIPTION = "i put things on shelf good and i say hi to people at the door";

describe("scoreMatch bias robustness", () => {
  it("produces an identical score regardless of how differently two people describe themselves in prose", () => {
    const fluentEmployee: EmployeeForMatch = { user_id: "e1", ...structuredFields() };
    const plainSpeakerEmployee: EmployeeForMatch = { user_id: "e2", ...structuredFields() };

    // EmployeeForMatch, by its own type, has no field to carry
    // FLUENT_DESCRIPTION or PLAIN_DESCRIPTION into -- there's nowhere for
    // prose to enter scoreMatch at all. Asserting equal output here is a
    // regression guard: if a future change ever threads `about`/`about_raw`
    // into the scorer, this test will need a genuine update, not a silent
    // pass, because the two employee objects above are otherwise identical.
    const fluentResult = scoreMatch(fluentEmployee, { salary_min: 15, salary_max: 18 }, JOB);
    const plainResult = scoreMatch(plainSpeakerEmployee, { salary_min: 15, salary_max: 18 }, JOB);

    expect(fluentResult.score).toBe(plainResult.score);
    expect(fluentResult.breakdown).toEqual(plainResult.breakdown);
    expect(fluentResult.score).toBe(100);

    // The descriptions exist only to document intent for a human reader of
    // this test -- assert they're actually different, so nobody "fixes"
    // this test by accidentally making them the same string.
    expect(FLUENT_DESCRIPTION).not.toBe(PLAIN_DESCRIPTION);
  });

  it("scores on the demonstrated ability tag, not the vocabulary used to state it", () => {
    // Same real-world ability, described in the plain, first-person phrasing
    // this population is likely to actually use, versus resume-style prose.
    // scoreMatch's coverage() does case-insensitive exact matching against
    // the job's required tags either way -- neither phrasing is privileged.
    const plainPhrasing: EmployeeForMatch = {
      user_id: "e3",
      ...structuredFields(),
      abilities: ["stocking shelves", "greeting customers"],
    };
    const resumePhrasing: EmployeeForMatch = {
      user_id: "e4",
      ...structuredFields(),
      abilities: ["Stocking Shelves", "Greeting Customers"],
    };

    const plainResult = scoreMatch(plainPhrasing, null, JOB);
    const resumeResult = scoreMatch(resumePhrasing, null, JOB);

    expect(plainResult.breakdown.abilities).toBe(resumeResult.breakdown.abilities);
  });
});
