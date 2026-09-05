/**
 * The standalone "translator" -- turns a person's own words into a short
 * professional rewrite an employer can read, on demand, from anywhere they
 * type freeform text on their profile. This is the always-available version
 * of the same rule resume-parse.ts and the Passport Guide voice agent both
 * already follow for about_raw/about: never invent a fact, always keep the
 * original alongside the rewrite, and the person approves before anything
 * is saved -- this function only produces the candidate rewrite, it never
 * saves on its own.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Rephrase the following into one or two short, professional sentences an
employer can read, using ONLY information present in the input.

Rules, all mandatory:
- If a detail is not stated, it does not appear in your output. Never add
  an adjective about the person's character (do not write "excellent,"
  "hardworking," "detail-oriented" unless those exact ideas were said).
- Do not add a new fact, a new skill, a new frequency, or a new outcome
  that wasn't in the input.
- Do not use the word "disability" or any diagnosis-adjacent term -- this
  is a phrasing pass, not a summary of a person.

Return only the rephrased sentence, nothing else -- no preamble, no quotes
around it, no explanation.`;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface TranslateResult {
  raw: string;
  professional: string;
}

export async function translateToProfessional(raw: string): Promise<TranslateResult> {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { raw, professional: "" };

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 256,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: trimmed }],
  });

  const block = response.content.find((b) => b.type === "text");
  const professional = block && block.type === "text" ? block.text.trim() : "";
  return { raw, professional };
}
