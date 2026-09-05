/**
 * Small helpers so the app can boot with a friendly message before the
 * team has pasted keys in. Checked at request time, not build time.
 */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function hasElevenLabsEnv(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY &&
      process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID_EMPLOYEE,
  );
}

export function hasAnthropicEnv(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
