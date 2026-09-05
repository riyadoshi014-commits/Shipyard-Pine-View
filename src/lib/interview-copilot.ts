/**
 * Employer-side interview copilot. Used openly, on the employer's own
 * device, during or just after their own interview -- reads the
 * conversation so far as context and suggests follow-up questions grounded
 * in the job's actual required abilities.
 *
 * This is NOT the participant-facing "ethical Cluely" idea from the team's
 * original brainstorm (docs/kickoff-notes-2026-09-05.md) -- it doesn't run
 * on the candidate's device, isn't hidden from anyone, and never feeds an
 * answer to the person being evaluated. See the project's risk notes for why
 * that idea was rejected; this is the disclosed, employer-only version of
 * the same underlying need ("help the employer understand the candidate").
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { Job } from "@/lib/domain";

const FORBIDDEN_TOPIC_PATTERNS = [
  /disab/i,
  /diagnos/i,
  /medicat/i,
  /guardian/i,
  /\bcondition\b/i,
  /what happened to (you|them|him|her)/i,
];

const SYSTEM_PROMPT = `You help an employer get more out of a job interview they are conducting
themselves, using the conversation so far as context. You are not talking to
the candidate and the candidate never sees your output.

Suggest 2-4 short follow-up questions the employer could ask next, grounded
in the job's required abilities below -- never generic interview questions.
Prefer questions that ask the candidate to walk through how they'd do a
specific task, not questions about traits or personality.

Absolutely forbidden, in any form: questions about disability, diagnosis,
medication, guardianship, or "what happened" to the candidate. If the
conversation touched on any of that, do not follow up on it -- redirect back
to abilities and tasks.

Also write one short line on what a strong answer would sound like, so the
employer knows what to listen for.

Return only the suggestions and the listen-for line -- no preamble.`;

export interface CopilotSuggestion {
  suggestedQuestions: string[];
  whatToListenFor: string;
  flagged: boolean;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

function containsForbiddenTopic(text: string): boolean {
  return FORBIDDEN_TOPIC_PATTERNS.some((p) => p.test(text));
}

export async function suggestFollowUps(job: Job, transcriptSoFar: string): Promise<CopilotSuggestion> {
  const context = `Job: ${job.title}\nRequired abilities: ${job.abilities_required.join(", ") || "(none listed)"}\n${
    job.description ? `Description: ${job.description}` : ""
  }`;

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 512,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    messages: [
      {
        role: "user",
        content: `${context}\n\nConversation so far:\n${transcriptSoFar || "(interview just started -- no answers yet)"}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";

  if (containsForbiddenTopic(text)) {
    // Fail closed: never surface a suggestion that trips the check.
    return { suggestedQuestions: [], whatToListenFor: "", flagged: true };
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const listenForIdx = lines.findIndex((l) => /listen for/i.test(l));
  const suggestedQuestions = (listenForIdx >= 0 ? lines.slice(0, listenForIdx) : lines).filter((l) =>
    /^[-*\d.]/.test(l)
  );
  const whatToListenFor = listenForIdx >= 0 ? lines.slice(listenForIdx).join(" ") : "";

  return { suggestedQuestions, whatToListenFor, flagged: false };
}
