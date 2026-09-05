import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildTextOnboardingSystemPrompt } from "@/lib/agent/text-onboarding-prompt";
import { TEXT_ONBOARDING_TOOLS } from "@/lib/agent/text-onboarding-tools";

/**
 * One turn of the Claude-powered text onboarding agent. This exists because
 * "Type instead" previously still opened an ElevenLabs session
 * (POST /api/agent/session, textOnly: true) -- so without
 * ELEVENLABS_API_KEY, typing failed exactly the same way voice did. This
 * route needs only ANTHROPIC_API_KEY, which is already configured.
 *
 * No auth check here: this route never touches Supabase or local storage --
 * it only decides what to say and which tool to call next. Tool EXECUTION
 * happens back in the browser (src/components/agent/text-onboarding.tsx),
 * through the exact same buildPassportClientTools() functions the
 * ElevenLabs agent uses, so a signed-in user's writes still go through
 * their own Supabase session (RLS applies) and an anonymous visitor's
 * writes still go to the browser-local store. This route is stateless: the
 * client resends the full message history every turn.
 *
 * Model: claude-sonnet-5, not claude-fable-5-1. Fable 5.1 requires the
 * organization to have 30-day data retention configured or every call 400s
 * -- a setting this code can't verify or control. Using it here risks
 * recreating the exact "doesn't work" failure this route exists to fix.
 * Sonnet 5 has no such requirement and is already used successfully
 * elsewhere in this app (resume parsing, interview copilot, the profile
 * translator). If the org's retention is later confirmed to meet the
 * requirement, swapping to claude-fable-5-1 needs no other code change
 * here since tool_choice is already "auto" (forced tool_choice is what
 * Fable 5.1 rejects, and this route never uses it).
 */
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages as Anthropic.MessageParam[] | undefined;
  const userFirstName: string = body?.userFirstName ?? "there";
  const profileStatus: string = body?.profileStatus ?? "Nothing saved yet.";

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  try {
    const response = await getClient().messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: [
        { type: "text", text: buildTextOnboardingSystemPrompt(userFirstName, profileStatus), cache_control: { type: "ephemeral" } },
      ],
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      tool_choice: { type: "auto" },
      tools: TEXT_ONBOARDING_TOOLS,
      messages,
    });

    return NextResponse.json({ content: response.content, stopReason: response.stop_reason });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "The guide is not available right now." },
      { status: 502 }
    );
  }
}
