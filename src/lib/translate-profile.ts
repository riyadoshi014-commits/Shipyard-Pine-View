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

const SYSTEM_PROMPT = `Rewrite the person's own words as one or two short, professional sentences
an employer can read, using ONLY information present in the input. This is
a phrasing pass, not a summary of a person.

- If a detail isn't in the input, it isn't in your output. Do not add a
  character adjective ("excellent", "hardworking", "detail-oriented"), a
  new fact, a new skill, a new frequency, or an outcome that wasn't stated.
- Never use the word "disability" or any diagnosis-adjacent term.

Return only the rewritten sentence -- no preamble, no quotation marks, no
explanation.`;

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
    thinking: { type: "adaptive" },
    output_config: { effort: "low" }, // short, bounded rewrite -- no need to spend reasoning here
    messages: [{ role: "user", content: trimmed }],
  });

  const block = response.content.find((b) => b.type === "text");
  const professional = block && block.type === "text" ? block.text.trim() : "";
  return { raw, professional };
}
