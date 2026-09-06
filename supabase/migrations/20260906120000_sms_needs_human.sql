-- The inbound-SMS handler runs a deterministic distress-marker check on every
-- message ("hurt myself", "want to die", ...). Until now the result was
-- computed and thrown away. These columns let the webhook flag a conversation
-- so a mentor/coach view can surface it and a human can take over.
--
-- Additive only. sms_conversations is service-role-only (RLS enabled, no
-- policies) exactly like the rest of the SMS tables, so no policy changes.

alter table public.sms_conversations
  add column if not exists needs_human boolean not null default false,
  add column if not exists needs_human_at timestamptz;

comment on column public.sms_conversations.needs_human is
  'Set by the inbound webhook when deterministic distress markers fire. A human must review; the bot still sends its warm hand-off reply.';

-- Partial index so an "inbox" of conversations awaiting a human is cheap.
create index if not exists sms_conversations_needs_human_idx
  on public.sms_conversations (needs_human_at) where needs_human;
