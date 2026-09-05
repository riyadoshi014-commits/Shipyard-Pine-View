import { describe, expect, it } from "vitest";
import { canPublish, savedSections, summarizeStatus } from "./profile-status";

const empty = {
  headline: "",
  city: "",
  about: "",
  abilities: [],
  accommodations: [],
  availability: [],
  awards: [],
  education: [],
  volunteer: [],
};

describe("summarizeStatus", () => {
  it("reports nothing saved for a fresh profile", () => {
    expect(summarizeStatus(empty, null)).toBe("Nothing saved yet.");
    expect(summarizeStatus(null, null)).toBe("Nothing saved yet.");
  });

  it("lists saved and missing sections in order", () => {
    const profile = {
      ...empty,
      headline: "Friendly team member",
      city: "Sarasota",
      abilities: ["stocking shelves"],
    };
    expect(summarizeStatus(profile, null)).toBe(
      "Saved: basics, abilities. Missing: accommodations, availability, story, history, pay.",
    );
  });

  it("needs both city and headline for basics", () => {
    expect(savedSections({ ...empty, city: "Sarasota" }, null)).toEqual([]);
  });

  it("counts any history item and a salary as saved", () => {
    const profile = { ...empty, volunteer: [{ title: "Food bank" }] };
    expect(savedSections(profile, { salary_min: 15 })).toEqual(["history", "pay"]);
  });

  it("says ready when everything is saved", () => {
    const full = {
      headline: "h",
      city: "c",
      about: "a",
      abilities: ["x"],
      accommodations: ["y"],
      availability: ["z"],
      awards: [{ title: "w" }],
      education: [],
      volunteer: [],
    };
    expect(summarizeStatus(full, { salary_min: 15 })).toBe(
      "Everything is saved. Ready to finish.",
    );
  });
});

describe("canPublish", () => {
  it("requires basics and abilities only", () => {
    expect(canPublish(empty, null)).toBe(false);
    expect(
      canPublish({ ...empty, headline: "h", city: "c", abilities: ["a"] }, null),
    ).toBe(true);
  });
});
