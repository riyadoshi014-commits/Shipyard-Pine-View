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

import { translateToProfessional } from "./translate-profile";

describe("translateToProfessional", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  });

  it("returns empty output for empty input without calling the model", async () => {
    const result = await translateToProfessional("   ");
    expect(result).toEqual({ raw: "   ", professional: "" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns both the raw input and the model's rewrite", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "  Restocks shelves reliably.  " }] });

    const result = await translateToProfessional("i put stuff on shelf good");

    expect(result.raw).toBe("i put stuff on shelf good");
    expect(result.professional).toBe("Restocks shelves reliably.");
  });

  it("instructs the model never to invent a fact not present in the input", async () => {
    mockCreate.mockResolvedValue({ content: [{ type: "text", text: "ok" }] });
    await translateToProfessional("something");

    const call = mockCreate.mock.calls[0][0];
    const systemText = call.system[0].text as string;
    expect(systemText).toMatch(/ONLY information present in the input/i);
    expect(systemText).toMatch(/Do not add/i);
  });
});
