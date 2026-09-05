// The real "server-only" package unconditionally throws when imported --
// Next's bundler swaps in a no-op stub only during its own build, and
// Vitest never goes through that resolution step. Mock it directly.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { sendSms } from "./ghl";

describe("sendSms", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.stubEnv("HIGHLEVEL_PRIVATE_INTEGRATION_KEY", "");
    vi.stubEnv("HIGHLEVEL_LOCATION_ID", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  it("fails clearly instead of throwing when GHL isn't configured", async () => {
    const result = await sendSms("+15551234567", "hello");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/HIGHLEVEL_PRIVATE_INTEGRATION_KEY|HIGHLEVEL_LOCATION_ID/);
  });

  it("sends via the GHL Conversations API and returns the provider message id on success", async () => {
    vi.stubEnv("HIGHLEVEL_PRIVATE_INTEGRATION_KEY", "test-key");
    vi.stubEnv("HIGHLEVEL_LOCATION_ID", "test-location");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: "msg_123" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await sendSms("+15551234567", "hello", "contact_1");

    expect(result).toEqual({ ok: true, providerMessageId: "msg_123" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/conversations/messages");
    expect(init.headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ type: "SMS", locationId: "test-location", contactId: "contact_1", phone: "+15551234567", message: "hello" });
  });

  it("reports a non-2xx GHL response as a failure rather than throwing", async () => {
    vi.stubEnv("HIGHLEVEL_PRIVATE_INTEGRATION_KEY", "test-key");
    vi.stubEnv("HIGHLEVEL_LOCATION_ID", "test-location");
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429, text: async () => "rate limited" }) as unknown as typeof fetch;

    const result = await sendSms("+15551234567", "hello");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("429");
  });
});
