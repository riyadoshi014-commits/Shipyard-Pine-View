/**
 * Pure text helpers used by the agent client tools. No I/O, fully unit-tested.
 */

const LIST_LIMIT = 20;
const ITEM_LIMIT = 60;

/**
 * Turns "greeting customers, stocking shelves; following a checklist" into a
 * clean, de-duplicated array. Splits on commas, semicolons and newlines.
 */
export function parseList(input: string | null | undefined): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[,;\n]+/)) {
    const item = raw.trim().replace(/\s+/g, " ").slice(0, ITEM_LIMIT);
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= LIST_LIMIT) break;
  }
  return out;
}

/** "Nick Alvarez" -> "Nick"; "" -> "there". */
export function firstName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || "there";
}

/**
 * URL-safe slug for a Passport, e.g. "nick-7k3q". The random suffix keeps
 * slugs unique without leaking anything about the person.
 */
export function makePassportSlug(
  fullName: string | null | undefined,
  random: () => number = Math.random,
): string {
  const rawFirst = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const base =
    rawFirst
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "passport";
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(random() * alphabet.length)];
  }
  return `${base}-${suffix}`;
}
