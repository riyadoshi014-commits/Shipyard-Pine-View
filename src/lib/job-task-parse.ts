/**
 * Job-posting parsing -- the employer-side mirror of resume-parse.ts. The
 * product's thesis is that a resume or a job title can't capture what
 * actually matters, for job seekers AND for employers: an employer typing
 * "I need someone to help me during the lunch rush, mostly running the
 * register and keeping the counter stocked" should get the same kind of
 * structured, plain-language suggestions back that a job seeker's resume
 * gets turned into. This never writes anything -- the caller (the job
 * posting form) shows the suggestions and lets the employer accept, edit,
 * or ignore each one before the real form is submitted, same rule
 * resume-parse.ts and translate-profile.ts already follow.
 *
 * Never invents a requirement: the prompt only allows tasks/abilities
 * actually described or clearly implied by the description text. There is
 * no age, disability, or health-related field on Job (see src/lib/domain.ts)
 * and this module must never suggest one -- the schema below has no room
 * for anything of the sort, by construction, the same way resume-parse.ts's
 * schema has no seniority score or personality read.
 *
 * Accommodations here are framed strictly as "what the employer can
 * provide" (accommodations_offered on Job/EmployerProfile) -- never as a
 * candidate filter or requirement. They're only suggested when the
 * description itself mentions support needs, training, or flexibility;
 * otherwise the list is left empty rather than guessed.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface ParsedJobTasks {
  suggestedTitle?: string;
  suggestedAbilities: string[];
  suggestedAccommodations: string[];
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "submit_job_task_summary",
  description: "Submit the extracted job title, abilities, and accommodations suggestions.",
  input_schema: {
    type: "object",
    properties: {
      suggestedTitle: {
        type: "string",
        description: "A short, plain job title that matches what's actually described, e.g. 'Counter Associate' -- not corporate jargon. Omit if the description doesn't support one.",
      },
      suggestedAbilities: {
        type: "array",
        items: { type: "string" },
        description: "2 to 8 short, concrete abilities actually described or clearly implied by the tasks in this posting -- plain language a job coach would use, matching this app's existing vocabulary (e.g. 'stocking shelves', 'cash register', 'greeting customers'), not resume jargon like 'inventory management'.",
      },
      suggestedAccommodations: {
        type: "array",
        items: { type: "string" },
        description: "Only if the description mentions support needs, training, or flexibility (e.g. 'we'll train you', 'flexible hours', 'happy to show you step by step'): short accommodations the EMPLOYER can provide, in the same plain vocabulary as this app's accommodation list (e.g. 'Extra training time', 'Written instructions', 'Regular schedule'). Never a candidate requirement or filter. Leave empty if nothing in the description supports one -- do not guess.",
      },
    },
    required: ["suggestedAbilities", "suggestedAccommodations"],
    additionalProperties: false,
  },
  strict: true,
};

const SYSTEM_PROMPT = `Extract only the tasks and abilities actually described or clearly implied by
this job description. Do not invent a requirement the employer didn't
describe. If the description is vague or short, extract fewer items rather
than padding the list with generic guesses.

Write "suggestedAbilities" in plain, concrete language a job coach would
use -- what the person would actually do, not resume jargon or corporate
buzzwords (e.g. "stocking shelves" not "inventory management", "cash
register" not "point-of-sale operations").

Suggest a short, plain "suggestedTitle" only if the description clearly
supports one.

Only suggest "suggestedAccommodations" if the description itself mentions
something about support needs, training, or flexibility (for example: the
employer says they'll train the person, offers flexible hours, or mentions
being willing to walk someone through steps). Frame every accommodation
suggestion strictly as something the EMPLOYER can provide -- never as a
candidate filter, requirement, or anything about who the candidate is. If
nothing in the description supports an accommodation suggestion, leave the
list empty rather than guessing.

Never produce anything resembling an age, disability, or health-related
field. There is no such field on a job posting in this app and you must
never suggest, imply, or ask about one -- not as a requirement, not as an
accommodation, not in the title.`;

export async function parseJobTasksFromDescription(description: string): Promise<ParsedJobTasks> {
  const trimmed = description.trim();
  if (trimmed.length === 0) return { suggestedAbilities: [], suggestedAccommodations: [] };

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    tools: [EXTRACT_TOOL],
    tool_choice: { type: "tool", name: "submit_job_task_summary" },
    messages: [{ role: "user", content: `Job description:\n\n${trimmed}` }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use" && b.name === "submit_job_task_summary");
  if (!toolUse || toolUse.type !== "tool_use") {
    return { suggestedAbilities: [], suggestedAccommodations: [] };
  }
  const input = toolUse.input as ParsedJobTasks;
  return {
    suggestedTitle: input.suggestedTitle,
    suggestedAbilities: input.suggestedAbilities ?? [],
    suggestedAccommodations: input.suggestedAccommodations ?? [],
  };
}
