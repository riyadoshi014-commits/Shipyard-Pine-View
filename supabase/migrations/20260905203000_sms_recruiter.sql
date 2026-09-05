-- SMS "recruiter that works for you all of the time" -- additive only.
-- Does not touch any table from 20260905192406_init.sql.
--
-- Inbound SMS isn't tied to a browser session, so this is written and read
-- exclusively by the service role (the webhook route and any admin view) --
-- RLS is enabled with no policies for anon/authenticated, which denies both
-- by default. That's deliberate: a text conversation may exist before the
-- sender has an account at all, so there is no `auth.uid()` to check against.

create table public.sms_conversations (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  employee_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.sms_conversations is 'One row per phone number that has texted in. employee_id is set once/if the number is later linked to a signed-up user.';

create index sms_conversations_employee_id_idx on public.sms_conversations (employee_id);

alter table public.sms_conversations enable row level security;
-- No policies: service role only (bypasses RLS). Deliberate -- see header.

create trigger sms_conversations_set_updated_at
  before update on public.sms_conversations
  for each row execute function private.set_updated_at();

create table public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.sms_conversations (id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null check (char_length(body) between 1 and 1600),
  provider_message_id text unique,
  created_at timestamptz not null default now()
);
comment on table public.sms_messages is 'provider_message_id is unique so a GHL/Twilio webhook retry cannot duplicate a reply.';

create index sms_messages_conversation_id_created_at_idx
  on public.sms_messages (conversation_id, created_at);

alter table public.sms_messages enable row level security;
-- No policies: service role only. Same reasoning as sms_conversations.

grant select, insert, update on public.sms_conversations, public.sms_messages to service_role;
