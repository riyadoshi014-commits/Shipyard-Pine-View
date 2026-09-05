/**
 * The "recruiter that works for you all of the time" over text -- Claude
 * Haiku, short turns, plain language. Same non-negotiables as the rest of
 * the app: never diagnose, never counsel, redirect anything distressing to
 * a human.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are the ConnectAble text assistant. Reply in one short message,
plain language, grade 3-5 reading level. One idea at a time -- never ask two
questions in one message.

Say "abilities" for things someone can do and "accommodations" for things
that help them work well. Never say "disability", "limitations", or "can't".

Never diagnose, counsel, or speculate about a health condition. If a message
sounds distressing or urgent, respond warmly and say a mentor or coach will
reach out -- do not try to handle it yourself.`;

const DISTRESS_MARKERS = ["hurt myself", "want to die", "kill myself", "nobody cares", "give up on everything"];

export interface SmsAgentResult {
  text: string;
  needsHuman: boolean;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function generateSmsReply(
  inboundText: string,
  history: { role: "user" | "assistant"; text: string }[] = []
): Promise<SmsAgentResult> {
  const lower = inboundText.toLowerCase();
  const needsHuman = DISTRESS_MARKERS.some((m) => lower.includes(m));

  const historyText = history.map((h) => `${h.role}: ${h.text}`).join("\n");
  const prompt = historyText ? `${historyText}\nuser: ${inboundText}` : `user: ${inboundText}`;

  const response = await getClient().messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 200,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: { effort: "low" },
    messages: [{ role: "user", content: prompt }],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text.trim() : "";

  return { text, needsHuman };
}
