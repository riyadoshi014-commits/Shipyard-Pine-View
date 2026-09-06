// run.ts is server-only (no DOM APIs used); the real "server-only" package
// unconditionally throws when imported outside Next's own build, so mock it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const mockFrom = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

import { tryRunMatching } from "./run";

/**
 * Supabase client errors (PostgrestError, AuthError, ...) are plain objects
 * with a .message string -- never `instanceof Error`. This is exactly the
 * shape a rejected/rotated SUPABASE_SECRET_KEY produces, and it's the bug
 * that let a real credential failure go undiagnosed: the old
 * `e instanceof Error ? e.message : String(e)` extraction always fell to
 * String(e) for this shape, producing "[object Object]" and silently
 * skipping the specific, actionable diagnostic below.
 */
function supabaseStyleError(message: string) {
  return { message, hint: "Double check the provided API key for typos." };
}

function chain(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = () => builder;
  builder.in = () => builder;
  builder.upsert = () => Promise.resolve(result);
  builder.then = (resolve: (v: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

describe("tryRunMatching error diagnostics", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockFrom.mockReset();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("recognizes a rejected service-role key even though Supabase's error is a plain object, not an Error instance", async () => {
    const rejectedKeyError = supabaseStyleError("Invalid API key");
    mockFrom.mockImplementation(() => chain({ data: null, error: rejectedKeyError }));

    await tryRunMatching({ jobIds: ["job-1"] });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [firstArg] = consoleErrorSpy.mock.calls[0];
    expect(firstArg).toContain("the Supabase service-role credential is being rejected");
    expect(firstArg).toContain("SUPABASE_SECRET_KEY");
  });

  it("still falls back to a generic message for an unrelated failure shape", async () => {
    mockFrom.mockImplementation(() => chain({ data: null, error: supabaseStyleError("relation \"jobs\" does not exist") }));

    await tryRunMatching({ jobIds: ["job-1"] });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    const [firstArg] = consoleErrorSpy.mock.calls[0];
    expect(firstArg).toBe("matching failed");
  });

  it("also recognizes a rejected key when it arrives as a real Error instance", async () => {
    mockFrom.mockImplementation(() => chain({ data: null, error: new Error("JWT expired") }));

    await tryRunMatching({ employeeId: "emp-1" });

    const [firstArg] = consoleErrorSpy.mock.calls[0];
    expect(firstArg).toContain("the Supabase service-role credential is being rejected");
  });
});
