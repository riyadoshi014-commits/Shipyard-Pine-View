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

const SYSTEM_PROMPT = `You help an employer run their own job interview better. You read the
conversation so far and suggest what to ask next. You are not talking to the
candidate, and the candidate never sees this.

Suggest 2-4 short follow-up questions grounded in the job's required
abilities below -- never generic interview questions. Favour questions that
ask the candidate to walk through how they would do a specific task, not
questions about traits or personality.

Never suggest a question about disability, diagnosis, medication,
guardianship, a medical condition, or "what happened" to the candidate --
in any form. If the conversation drifted toward any of that, steer your
suggestions back to tasks and abilities.

Also write one short line describing what a strong answer would sound like,
so the employer knows what to listen for.

Submit your answer through the submit_followups tool -- plain text only, no
markdown formatting (no "**", no numbered or bulleted prefixes; the caller
adds its own list formatting).`;

const SUBMIT_TOOL: Anthropic.Tool = {
  name: "submit_followups",
  description: "Submit the suggested interview follow-up questions and what a strong answer sounds like.",
  input_schema: {
    type: "object",
    properties: {
      suggestedQuestions: {
        type: "array",
        items: { type: "string" },
        description: "2 to 4 short follow-up questions, plain text, no leading bullet/number and no markdown.",
      },
      whatToListenFor: {
        type: "string",
        description: "One short, plain-text line describing what a strong answer would sound like.",
      },
    },
    required: ["suggestedQuestions", "whatToListenFor"],
    additionalProperties: false,
  },
  strict: true,
};

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
    tools: [SUBMIT_TOOL],
    tool_choice: { type: "tool", name: "submit_followups" },
    messages: [
      {
        role: "user",
        content: `${context}\n\nConversation so far:\n${transcriptSoFar || "(interview just started -- no answers yet)"}`,
      },
    ],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use" && b.name === "submit_followups");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { suggestedQuestions: [], whatToListenFor: "", flagged: false };
  }

  const input = toolUse.input as { suggestedQuestions?: string[]; whatToListenFor?: string };
  const suggestedQuestions = input.suggestedQuestions ?? [];
  const whatToListenFor = input.whatToListenFor ?? "";

  if (suggestedQuestions.some(containsForbiddenTopic) || containsForbiddenTopic(whatToListenFor)) {
    // Fail closed: never surface a suggestion that trips the check, no
    // matter which structured field it landed in.
    return { suggestedQuestions: [], whatToListenFor: "", flagged: true };
  }

  return { suggestedQuestions, whatToListenFor, flagged: false };
}
