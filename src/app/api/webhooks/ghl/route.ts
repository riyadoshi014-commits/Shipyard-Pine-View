import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/comms/ghl";
import { generateSmsReply } from "@/lib/comms/sms-agent";

/**
 * Inbound SMS from GoHighLevel's Conversations webhook. Point the
 * sub-account's inbound webhook at https://connectable.work/api/webhooks/ghl.
 *
 * NOTE: field names below follow GHL's documented Conversations webhook
 * shape, but should be checked against a real test message once the webhook
 * is actually configured in the dashboard -- adjust the destructuring to
 * match what the real payload sends before relying on it for a demo.
 *
 * Two rules that matter on stage:
 *  - Return 200 immediately. GHL retries any non-2xx, and generating a
 *    reply inline would mean a judge sees the same text three times.
 *    `after()` runs the reply generation once the response has already
 *    gone out -- the correct pattern on a serverless platform, where a
 *    fire-and-forget setTimeout is not guaranteed to survive past the
 *    response (the function can freeze or be torn down right after return).
 *  - De-duplicate on the provider's own message id (a retry must not
 *    enqueue a second reply) -- enforced by the unique constraint on
 *    sms_messages.provider_message_id in the migration, not just app logic.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const messageId: string | undefined = body.messageId ?? body.id;
  const phone: string | undefined = body.phone ?? body.contactPhone;
  const text: string | undefined = body.message ?? body.body;
  if (!phone || !text) return NextResponse.json({ ok: true });

  const supabase = createAdminClient();

  const { data: conversation, error: convError } = await supabase
    .from("sms_conversations")
    .upsert({ phone }, { onConflict: "phone", ignoreDuplicates: false })
    .select("id")
    .single();
  if (convError || !conversation) {
    console.error("sms_conversations upsert failed", convError);
    return NextResponse.json({ ok: true }); // ack anyway -- GHL should not retry on our DB issue
  }

  const { error: insertError } = await supabase
    .from("sms_messages")
    .insert({ conversation_id: conversation.id, direction: "inbound", body: text, provider_message_id: messageId });
  if (insertError) {
    // Unique violation on provider_message_id means this is a GHL retry of
    // a message we already processed -- ack and do nothing further.
    return NextResponse.json({ ok: true });
  }

  after(async () => {
    try {
      const { data: history } = await supabase
        .from("sms_messages")
        .select("direction, body")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(20);

      const historyForAgent = (history ?? [])
        .slice(0, -1) // drop the inbound message we just inserted -- it's passed separately
        .map((m) => ({ role: (m.direction === "inbound" ? "user" : "assistant") as "user" | "assistant", text: m.body }));

      const reply = await generateSmsReply(text, historyForAgent);
      if (!reply.text) return;

      const sendResult = await sendSms(phone, reply.text);
      await supabase.from("sms_messages").insert({
        conversation_id: conversation.id,
        direction: "outbound",
        body: reply.text,
        provider_message_id: sendResult.providerMessageId,
      });
    } catch (err) {
      // A dropped reply should surface as a monitoring alert, not a 500 on
      // a webhook whose response has already been sent.
      console.error("SMS reply generation failed", err);
    }
  });

  return NextResponse.json({ ok: true });
}
