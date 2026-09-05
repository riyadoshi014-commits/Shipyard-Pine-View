// The real "server-only" package unconditionally throws when imported --
// Next's bundler swaps in a no-op stub only during its own build, and
// Vitest never goes through that resolution step. Mock it directly.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job } from "./domain";
vi.mock("server-only", () => ({}));

const mockCreate = vi.hoisted(() => vi.fn());

// A real class, not vi.fn().mockImplementation() -- the latter isn't
// reliably constructible with `new` across mock factories in this setup.
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import { suggestFollowUps } from "./interview-copilot";

const JOB: Job = {
  id: "job_1",
  employer_id: "employer_1",
  title: "Stock Associate",
  description: "Restock shelves and keep aisles tidy.",
  abilities_required: ["restocking shelves", "following a checklist"],
  city: "Sarasota",
  state: "FL",
  remote: "in_person",
  availability: ["weekday mornings"],
  salary_min: 14,
  salary_max: 16,
  accommodations_offered: ["written checklists"],
  status: "open",
};

describe("suggestFollowUps", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("fails closed and returns no suggestions when the model's own output trips the forbidden-topic check", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "- Ask about their diagnosis\nListen for: a calm answer" }],
    });

    const result = await suggestFollowUps(JOB, "Candidate mentioned a health condition.");

    expect(result.flagged).toBe(true);
    expect(result.suggestedQuestions).toEqual([]);
    expect(result.whatToListenFor).toBe("");
  });

  it("parses suggested questions and the listen-for line from a well-formed response", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: "- Walk me through how you'd restock this shelf\n- What would you do if you ran out of a checklist\nListen for: a clear, step-by-step answer",
        },
      ],
    });

    const result = await suggestFollowUps(JOB, "");

    expect(result.flagged).toBe(false);
    expect(result.suggestedQuestions).toHaveLength(2);
    expect(result.suggestedQuestions[0]).toContain("restock this shelf");
    expect(result.whatToListenFor).toContain("clear, step-by-step answer");
  });

  it("grounds the prompt in the job's actual required abilities, not generic questions", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "- A question\nListen for: something" }] });
    await suggestFollowUps(JOB, "");

    const call = mockCreate.mock.calls[0][0];
    const userMessage = call.messages[0].content as string;
    expect(userMessage).toContain("restocking shelves");
    expect(userMessage).toContain("following a checklist");

    const systemText = call.system[0].text as string;
    expect(systemText).toMatch(/disability|diagnosis|medication|guardianship/i);
  });
});
