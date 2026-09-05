import { describe, expect, it } from "vitest";
import { firstName, makePassportSlug, parseList } from "./text";

describe("parseList", () => {
  it("splits on commas, semicolons and newlines and trims", () => {
    expect(parseList(" greeting customers, stocking shelves;following a checklist\nteamwork ")).toEqual([
      "greeting customers",
      "stocking shelves",
      "following a checklist",
      "teamwork",
    ]);
  });

  it("drops empties and case-insensitive duplicates, keeping first spelling", () => {
    expect(parseList("Teamwork,, teamwork , TEAMWORK,")).toEqual(["Teamwork"]);
  });

  it("returns [] for null, undefined and blank input", () => {
    expect(parseList(null)).toEqual([]);
    expect(parseList(undefined)).toEqual([]);
    expect(parseList("   ")).toEqual([]);
  });

  it("caps list length and item length", () => {
    const many = Array.from({ length: 30 }, (_, i) => `item ${i}`).join(",");
    expect(parseList(many)).toHaveLength(20);
    expect(parseList("x".repeat(100))[0]).toHaveLength(60);
  });
});

describe("firstName", () => {
  it("takes the first word", () => {
    expect(firstName("Nick Alvarez")).toBe("Nick");
  });
  it("falls back to 'there'", () => {
    expect(firstName("")).toBe("there");
    expect(firstName(null)).toBe("there");
  });
});

describe("makePassportSlug", () => {
  it("uses a lowercase first name and a 4-char suffix", () => {
    const slug = makePassportSlug("Nick Alvarez", () => 0);
    expect(slug).toBe("nick-aaaa");
  });
  it("strips non-alphanumerics and falls back to 'passport'", () => {
    expect(makePassportSlug("Ñ!", () => 0.5)).toMatch(/^n-[a-z0-9]{4}$/);
    expect(makePassportSlug("", () => 0.5)).toMatch(/^passport-[a-z0-9]{4}$/);
  });
});
