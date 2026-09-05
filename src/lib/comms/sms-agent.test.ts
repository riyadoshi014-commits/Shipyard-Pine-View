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

import { generateSmsReply } from "./sms-agent";

describe("generateSmsReply", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "Thanks for reaching out!" }] });
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("flags distressing messages for a human, independent of what the model replies", async () => {
    const result = await generateSmsReply("I want to hurt myself");
    expect(result.needsHuman).toBe(true);
  });

  it("does not flag an ordinary message", async () => {
    const result = await generateSmsReply("What jobs are open near me?");
    expect(result.needsHuman).toBe(false);
  });

  it("returns the model's reply, trimmed", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "  Sure, here's what's open.  " }] });
    const result = await generateSmsReply("What jobs are open?");
    expect(result.text).toBe("Sure, here's what's open.");
  });

  it("uses the fast model and passes conversation history in order", async () => {
    await generateSmsReply("Second message", [{ role: "user", text: "First message" }]);

    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe("claude-haiku-4-5");
    const userMessage = call.messages[0].content as string;
    expect(userMessage).toBe("user: First message\nuser: Second message");
  });
});
