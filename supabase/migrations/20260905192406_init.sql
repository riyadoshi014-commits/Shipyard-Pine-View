-- ConnectAble initial schema.
-- Conventions: lowercase snake_case, text + check constraints for enums,
-- timestamptz everywhere, RLS on every table, auth.uid() wrapped in (select ...)
-- so it is evaluated once per query, indexes on every FK and policy column.

-- ---------------------------------------------------------------------------
-- Private schema for helpers that must not be reachable through the Data API.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated, supabase_auth_admin;

-- Keeps updated_at honest without trusting clients.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on signup.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'employee'
    check (role in ('employee', 'employer', 'mentor')),
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per signed-up user. role is chosen at signup and drives which sub-profile they fill in.';

alter table public.profiles enable row level security;

create policy "profiles: authenticated can read everyone"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles: owner can update"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- employee_profiles: the Ability Passport. Salary lives elsewhere on purpose.
-- ---------------------------------------------------------------------------
create table public.employee_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  headline text not null default '',
  about text not null default '',
  about_raw text not null default '',
  city text not null default '',
  state text not null default '',
  remote_preference text not null default 'either'
    check (remote_preference in ('remote', 'in_person', 'either')),
  availability text[] not null default '{}',
  abilities text[] not null default '{}',
  accommodations text[] not null default '{}',
  awards jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  volunteer jsonb not null default '[]'::jsonb,
  resume_path text,
  video_path text,
  passport_slug text unique,
  passport_public boolean not null default false,
  searchable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.employee_profiles is 'Whole-person profile for job seekers. about_raw is their own words; about is the professional rewrite they approved.';

create index employee_profiles_searchable_idx
  on public.employee_profiles (searchable) where searchable;
create index employee_profiles_abilities_idx
  on public.employee_profiles using gin (abilities);

alter table public.employee_profiles enable row level security;

create policy "employee_profiles: owner can read"
  on public.employee_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "employee_profiles: employers can read searchable"
  on public.employee_profiles for select
  to authenticated
  using (
    searchable
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'employer'
    )
  );

create policy "employee_profiles: anon can read public passports"
  on public.employee_profiles for select
  to anon
  using (passport_public);

create policy "employee_profiles: owner can insert"
  on public.employee_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "employee_profiles: owner can update"
  on public.employee_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger employee_profiles_set_updated_at
  before update on public.employee_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- employee_private: pay expectations. Owner and active mentor only.
-- There is deliberately no employer policy; the matcher reads this with the
-- service role on the server.
-- ---------------------------------------------------------------------------
create table public.employee_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  salary_min numeric(8, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(8, 2) check (salary_max is null or salary_max >= 0),
  updated_at timestamptz not null default now(),
  constraint employee_private_salary_order
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);
comment on table public.employee_private is 'Hourly pay range the employee considers fair. Never visible to employers.';

alter table public.employee_private enable row level security;

create policy "employee_private: owner can read"
  on public.employee_private for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "employee_private: owner can insert"
  on public.employee_private for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "employee_private: owner can update"
  on public.employee_private for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger employee_private_set_updated_at
  before update on public.employee_private
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- employer_profiles
-- ---------------------------------------------------------------------------
create table public.employer_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  company_name text not null default '',
  description text not null default '',
  website text,
  city text not null default '',
  state text not null default '',
  accommodations_offered text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.employer_profiles is 'accommodations_offered is what the employer can provide; the matcher scores for it, never against a candidate.';

alter table public.employer_profiles enable row level security;

create policy "employer_profiles: authenticated can read"
  on public.employer_profiles for select
  to authenticated
  using (true);

create policy "employer_profiles: owner can insert"
  on public.employer_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "employer_profiles: owner can update"
  on public.employer_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger employer_profiles_set_updated_at
  before update on public.employer_profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- jobs: the unit that employees are matched against.
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  abilities_required text[] not null default '{}',
  city text not null default '',
  state text not null default '',
  remote text not null default 'either'
    check (remote in ('remote', 'in_person', 'either')),
  availability text[] not null default '{}',
  salary_min numeric(8, 2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(8, 2) check (salary_max is null or salary_max >= 0),
  accommodations_offered text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_salary_order
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

create index jobs_employer_id_idx on public.jobs (employer_id);
create index jobs_open_idx on public.jobs (status) where status = 'open';

alter table public.jobs enable row level security;

create policy "jobs: authenticated can read open jobs, owner reads all"
  on public.jobs for select
  to authenticated
  using (status = 'open' or employer_id = (select auth.uid()));

create policy "jobs: employer can insert own"
  on public.jobs for insert
  to authenticated
  with check (
    employer_id = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'employer'
    )
  );

create policy "jobs: owner can update"
  on public.jobs for update
  to authenticated
  using (employer_id = (select auth.uid()))
  with check (employer_id = (select auth.uid()));

create policy "jobs: owner can delete"
  on public.jobs for delete
  to authenticated
  using (employer_id = (select auth.uid()));

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- matches: written only by the server-side scorer (service role).
-- ---------------------------------------------------------------------------
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  breakdown jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, employee_id)
);
comment on table public.matches is 'Deterministic fit score per (job, employee). breakdown holds the per-factor points so the % is explainable.';

create index matches_job_id_idx on public.matches (job_id);
create index matches_employee_id_idx on public.matches (employee_id);

alter table public.matches enable row level security;

create policy "matches: employee or job owner can read"
  on public.matches for select
  to authenticated
  using (
    employee_id = (select auth.uid())
    or exists (
      select 1 from public.jobs j
      where j.id = matches.job_id and j.employer_id = (select auth.uid())
    )
  );
-- No insert/update/delete policies: only the service role writes matches.

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function private.set_updated_at();

-- Runs under the caller's RLS, so "can I see this match" == "am I a participant".
create or replace function private.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (select 1 from public.matches m where m.id = p_match_id);
$$;
grant execute on function private.is_match_participant(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- match_feedback: each side's quick reaction, one row per (match, user).
-- Separate table so neither side can write the other's answer.
-- ---------------------------------------------------------------------------
create table public.match_feedback (
  match_id uuid not null references public.matches (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value text not null check (value in ('interested', 'not_now')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index match_feedback_user_id_idx on public.match_feedback (user_id);

alter table public.match_feedback enable row level security;

create policy "match_feedback: participants can read"
  on public.match_feedback for select
  to authenticated
  using ((select private.is_match_participant(match_id)));

create policy "match_feedback: participant can insert own"
  on public.match_feedback for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select private.is_match_participant(match_id))
  );

create policy "match_feedback: owner can update"
  on public.match_feedback for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create trigger match_feedback_set_updated_at
  before update on public.match_feedback
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- mentor_profiles and mentorships
-- ---------------------------------------------------------------------------
create table public.mentor_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  bio text not null default '',
  background_check text not null default 'not_started'
    check (background_check in ('not_started', 'pending', 'cleared')),
  capacity integer not null default 5 check (capacity between 0 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mentor_profiles enable row level security;

create policy "mentor_profiles: authenticated can read"
  on public.mentor_profiles for select
  to authenticated
  using (true);

create policy "mentor_profiles: owner can insert"
  on public.mentor_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "mentor_profiles: owner can update"
  on public.mentor_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger mentor_profiles_set_updated_at
  before update on public.mentor_profiles
  for each row execute function private.set_updated_at();

-- A mentor proposes (pending); the employee accepts (active). Either can end.
create table public.mentorships (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  employee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, employee_id),
  check (mentor_id <> employee_id)
);

create index mentorships_mentor_id_idx on public.mentorships (mentor_id);
create index mentorships_employee_id_idx on public.mentorships (employee_id);

alter table public.mentorships enable row level security;

create policy "mentorships: participants can read"
  on public.mentorships for select
  to authenticated
  using (mentor_id = (select auth.uid()) or employee_id = (select auth.uid()));

create policy "mentorships: mentor can propose"
  on public.mentorships for insert
  to authenticated
  with check (
    mentor_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'mentor'
    )
  );

create policy "mentorships: employee can accept or end"
  on public.mentorships for update
  to authenticated
  using (employee_id = (select auth.uid()))
  with check (employee_id = (select auth.uid()));

create policy "mentorships: mentor can withdraw or end"
  on public.mentorships for update
  to authenticated
  using (mentor_id = (select auth.uid()))
  with check (mentor_id = (select auth.uid()) and status in ('pending', 'ended'));

create trigger mentorships_set_updated_at
  before update on public.mentorships
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages (Tier 2): thread per match between employee and employer.
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_match_id_created_at_idx on public.messages (match_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

alter table public.messages enable row level security;

create policy "messages: participants can read"
  on public.messages for select
  to authenticated
  using ((select private.is_match_participant(match_id)));

create policy "messages: participant can send as self"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select private.is_match_participant(match_id))
  );

-- ---------------------------------------------------------------------------
-- Signup trigger: create profiles + the role sub-profile.
-- SECURITY DEFINER is required to write public.* from an auth.users trigger;
-- it lives in private, is locked down, and only touches the new user's rows.
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_name text;
begin
  v_role := new.raw_user_meta_data ->> 'role';
  if v_role is null or v_role not in ('employee', 'employer', 'mentor') then
    v_role := 'employee';
  end if;
  v_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');

  insert into public.profiles (id, role, full_name) values (new.id, v_role, v_name);

  if v_role = 'employee' then
    insert into public.employee_profiles (user_id) values (new.id);
    insert into public.employee_private (user_id) values (new.id);
  elsif v_role = 'employer' then
    insert into public.employer_profiles (user_id) values (new.id);
  else
    insert into public.mentor_profiles (user_id) values (new.id);
  end if;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;
grant execute on function private.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Data API exposure. Since 2026-04 new tables are not exposed automatically,
-- so grant exactly what the app needs. RLS still decides which rows.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update on
  public.profiles,
  public.employee_profiles,
  public.employee_private,
  public.employer_profiles,
  public.match_feedback,
  public.mentor_profiles,
  public.mentorships
to authenticated;

grant select, insert, update, delete on public.jobs to authenticated;
grant select on public.matches to authenticated;
grant select, insert on public.messages to authenticated;

grant select on public.profiles, public.employee_profiles to anon;

-- ---------------------------------------------------------------------------
-- Storage: resumes and videos are private (owner folder = user id);
-- avatars are public-read. Upsert needs insert + select + update.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resumes', 'resumes', false, 10485760,
    array['application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']),
  ('videos', 'videos', false, 104857600, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "storage: owner manages own private files"
  on storage.objects for all
  to authenticated
  using (
    bucket_id in ('resumes', 'videos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('resumes', 'videos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage: anyone can read avatars"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- Policies that reference tables created later in this file. Postgres checks
-- policy expressions at creation time, so they must come after every table.
-- ---------------------------------------------------------------------------
create policy "profiles: anon can read owners of public passports"
  on public.profiles for select
  to anon
  using (
    exists (
      select 1 from public.employee_profiles ep
      where ep.user_id = profiles.id and ep.passport_public
    )
  );

create policy "employee_profiles: active mentor can read"
  on public.employee_profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.mentorships m
      where m.mentor_id = (select auth.uid())
        and m.employee_id = employee_profiles.user_id
        and m.status = 'active'
    )
  );

create policy "employee_profiles: active mentor can update"
  on public.employee_profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.mentorships m
      where m.mentor_id = (select auth.uid())
        and m.employee_id = employee_profiles.user_id
        and m.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.mentorships m
      where m.mentor_id = (select auth.uid())
        and m.employee_id = employee_profiles.user_id
        and m.status = 'active'
    )
  );

create policy "employee_private: active mentor can read"
  on public.employee_private for select
  to authenticated
  using (
    exists (
      select 1 from public.mentorships m
      where m.mentor_id = (select auth.uid())
        and m.employee_id = employee_private.user_id
        and m.status = 'active'
    )
  );
