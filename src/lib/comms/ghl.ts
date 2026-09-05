/**
 * Outbound SMS via GoHighLevel's Conversations API, and inbound-webhook
 * idempotency. Server only -- the private integration key never reaches a
 * client bundle.
 */
import "server-only";

export interface SendSmsResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendSms(toE164: string, message: string, contactId?: string): Promise<SendSmsResult> {
  const key = process.env.HIGHLEVEL_PRIVATE_INTEGRATION_KEY;
  const locationId = process.env.HIGHLEVEL_LOCATION_ID;
  const apiBase = process.env.HIGHLEVEL_API_BASE ?? "https://services.leadconnectorhq.com";
  const apiVersion = process.env.HIGHLEVEL_API_VERSION ?? "2021-07-28";

  if (!key || !locationId) {
    return { ok: false, error: "HIGHLEVEL_PRIVATE_INTEGRATION_KEY or HIGHLEVEL_LOCATION_ID not set" };
  }

  try {
    const res = await fetch(`${apiBase}/conversations/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        Version: apiVersion,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "SMS", locationId, contactId, phone: toE164, message }),
    });
    if (!res.ok) {
      return { ok: false, error: `GHL ${res.status}: ${await res.text()}` };
    }
    const data = (await res.json()) as { messageId?: string; id?: string };
    return { ok: true, providerMessageId: data.messageId ?? data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * NOTE on A2P 10DLC: GHL rides on Twilio/LeadConnector underneath, so US
 * carrier registration still applies to this sub-account regardless of what
 * the dashboard says elsewhere. If live texts stop sending, check
 * Settings > Phone Numbers > Trust Center in the GHL sub-account before
 * assuming this code is broken.
 */
