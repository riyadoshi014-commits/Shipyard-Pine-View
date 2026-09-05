import type Anthropic from "@anthropic-ai/sdk";

/**
 * Tool schemas for the Claude-powered text onboarding agent. These name and
 * shape match src/lib/agent/client-tools.ts's PassportClientTools exactly --
 * the client executes a tool_use block by looking up this same name in that
 * map, so a name or parameter drift here silently breaks a save. If you add
 * a client tool, add its schema here too.
 *
 * strict:true on every tool guarantees Claude's arguments validate against
 * the schema before the client ever sees them. Forced tool_choice
 * ({type:"tool"/"any"}) 400s on Claude Fable 5.1, so tool_choice stays
 * "auto" -- the system prompt is what tells the model when to call each one.
 */
export const TEXT_ONBOARDING_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_profile_status",
    description: "Check which sections of the Passport are already saved and which are still missing.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
  {
    name: "save_basics",
    description: "Save the person's city, work preference, and a one-line headline about them at work.",
    input_schema: {
      type: "object",
      properties: {
        headline: { type: "string", description: 'A short line like "Friendly team member who loves organizing".' },
        city: { type: "string" },
        state: { type: "string", description: "Two-letter US state code." },
        remote_preference: { type: "string", enum: ["remote", "in_person", "either"] },
      },
      additionalProperties: false,
      required: [],
    },
    strict: true,
  },
  {
    name: "save_abilities",
    description: "Replace the person's list of abilities -- things they are good at, at work or at home.",
    input_schema: {
      type: "object",
      properties: {
        abilities: {
          type: "string",
          description: 'Comma-separated list of 3-8 short abilities, e.g. "greeting customers, stocking shelves, following a checklist".',
        },
      },
      additionalProperties: false,
      required: ["abilities"],
    },
    strict: true,
  },
  {
    name: "save_accommodations",
    description: "Replace the person's list of accommodations -- things that help them do their best work.",
    input_schema: {
      type: "object",
      properties: {
        accommodations: {
          type: "string",
          description: 'Comma-separated list, e.g. "written instructions, a regular schedule, a quiet space".',
        },
      },
      additionalProperties: false,
      required: ["accommodations"],
    },
    strict: true,
  },
  {
    name: "save_availability",
    description: "Replace the days and times the person can work.",
    input_schema: {
      type: "object",
      properties: {
        availability: {
          type: "string",
          description: 'Comma-separated list, e.g. "weekday mornings, Saturdays".',
        },
      },
      additionalProperties: false,
      required: ["availability"],
    },
    strict: true,
  },
  {
    name: "save_story",
    description: "Save a story about a time the person did a good job at something, in their own words and as a short professional rewrite.",
    input_schema: {
      type: "object",
      properties: {
        about_raw: { type: "string", description: "The person's own words, kept exactly as they said them." },
        about: { type: "string", description: "A one or two sentence professional version, built only from what they said." },
      },
      additionalProperties: false,
      required: ["about_raw", "about"],
    },
    strict: true,
  },
  {
    name: "add_history",
    description: "Add one award, education item, or volunteer experience. Call once per item.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["award", "education", "volunteer"] },
        title: { type: "string" },
        org: { type: "string" },
        year: { type: "string" },
        details: { type: "string" },
      },
      additionalProperties: false,
      required: ["kind", "title"],
    },
    strict: true,
  },
  {
    name: "save_salary",
    description: "Save the hourly pay range that feels fair to the person. This is private and never shown to employers.",
    input_schema: {
      type: "object",
      properties: {
        salary_min: { type: "number" },
        salary_max: { type: "number" },
      },
      additionalProperties: false,
      required: ["salary_min", "salary_max"],
    },
    strict: true,
  },
  {
    name: "finish_onboarding",
    description: "Publish the Passport once basics and abilities are saved, and get back the shareable link.",
    input_schema: { type: "object", properties: {}, additionalProperties: false, required: [] },
    strict: true,
  },
];
