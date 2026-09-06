// The real "server-only" package unconditionally throws when imported --
// Next's bundler swaps in a no-op stub only during its own build, and
// Vitest never goes through that resolution step. Mock it directly.
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const mockCreate = vi.hoisted(() => vi.fn());

// A real class, not vi.fn().mockImplementation() -- the latter isn't
// reliably constructible with `new` across mock factories in this setup.
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockCreate };
  },
}));

import { parseJobTasksFromDescription } from "./job-task-parse";

describe("parseJobTasksFromDescription", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("returns the fields the model extracted via the submit_job_task_summary tool", async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: "tool_use",
          name: "submit_job_task_summary",
          input: {
            suggestedTitle: "Counter Associate",
            suggestedAbilities: ["cash register", "stocking shelves"],
            suggestedAccommodations: ["Extra training time"],
          },
        },
      ],
    });

    const result = await parseJobTasksFromDescription(
      "I need someone to help me during the lunch rush, mostly running the register and keeping the counter stocked. We'll train you."
    );

    expect(result).toEqual({
      suggestedTitle: "Counter Associate",
      suggestedAbilities: ["cash register", "stocking shelves"],
      suggestedAccommodations: ["Extra training time"],
    });

    // Never invents facts: the system prompt sent to the model must say so.
    const call = mockCreate.mock.calls[0][0];
    const systemText = call.system[0].text as string;
    expect(systemText).toMatch(/do not invent a requirement/i);
    expect(systemText).toMatch(/never produce anything resembling an age, disability, or health-related/i);
  });

  it("falls back to empty suggestions when the model returns no tool_use block", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "I couldn't find a tool to call." }] });

    const result = await parseJobTasksFromDescription("Some job description");

    expect(result).toEqual({ suggestedAbilities: [], suggestedAccommodations: [] });
  });

  it("forces the model to call the extraction tool rather than free-text", async () => {
    mockCreate.mockResolvedValue({ content: [] });
    await parseJobTasksFromDescription("Some job description");

    const call = mockCreate.mock.calls[0][0];
    expect(call.tool_choice).toEqual({ type: "tool", name: "submit_job_task_summary" });
    expect(call.tools[0].name).toBe("submit_job_task_summary");
  });

  it("returns empty suggestions without calling the model for a blank description", async () => {
    const result = await parseJobTasksFromDescription("   ");

    expect(result).toEqual({ suggestedAbilities: [], suggestedAccommodations: [] });
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
