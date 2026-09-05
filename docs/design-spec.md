# ConnectAble — Design Spec

**Date:** 2026-09-05
**Owner:** Istiqlal (frontend + Supabase backend)
**Status:** approved scope

## 1. What we are building

ConnectAble is an inclusive-hiring platform for Inclusion Revolution (Sarasota-Manatee, FL). It connects job seekers with intellectual and developmental disabilities (IDD) to employers who can support them, with mentors as the bridge between the two. It is built in roughly 48 hours for a hackathon demo.

The **Ability Passport** is the shareable profile card inside ConnectAble: a public page at a stable URL, reachable by QR code or an NFC tag.

### Language rules (non-negotiable in UI copy)

- **Accommodations** when describing a need.
- **Ability** / **abilities** when describing a skillset. Never "skills gap", "limitations", or deficit language.
- Plain language everywhere. Short sentences. One idea per screen.

## 2. Users

| Role | Goal | Owner of journey notes |
|---|---|---|
| Employee | Build a whole-person profile, share it, get matched, hear back fast | Mitron |
| Employer | Post a role, see candidates ranked by fit, respond quickly | Maya |
| Mentor | See mentees, help maintain their profiles, track progress | Riya |

The AI recruiter serves both sides: it turns plain or fragmented language into professional profile text for employees, and drafts personality and soft-skill interview questions for employers. It is a **conversational voice agent** (voice and text in one component), not a hand-built chat UI. The agent fills the database through client tools; see section 4a.

## 3. Scope tiers

**Tier 1 — must ship, real code, seeded demo data**
1. Design system + accessibility foundation
2. Public landing page (video hero, testimonials, share-your-story, FAQs, about, CTAs, privacy, terms)
3. Sign up / log in / role selection, "check your inbox" confirmation screen
4. Employee onboarding as a conversation with the "Passport Guide" voice agent (voice + text) that writes the profile as it goes → profile editor to review and fix, with resume upload and parsed results
5. Ability Passport public page + QR code
6. Employer: profile, one job posting, candidate list with match %, candidate detail, quick feedback
7. Employee: "my matches" list with %
8. The same agent available as a side panel inside the app ("make this sound professional", "what's missing from my Passport?")

**Tier 2 — if time allows**
- Messaging thread between matched employee and employer
- Mentor dashboard (mentee list, edit mentee profile)
- Employer recruiter agent persona (second voice agent) that drafts personality and soft-skill interview questions and saves them to the job
- Captioned video intro upload

**Video / mockup only (not built)**
- NFC tag writing (demo with a pre-written tag pointing at a Passport URL)
- SMS agent on screen
- Video interviews
- "Ethical Cluely" overlay

**Dropped**
- Age filter (age-discrimination exposure)
- Insurance filter
- Employer-side filtering *out* by accommodations. Replaced by "accommodations we can provide" on the employer/job, which the matcher scores *for*.

## 4. Architecture

```
Browser (Next.js App Router, React Server Components + client islands)
   │
   ├── Supabase Auth (email + password, email confirmation on signup)
   ├── Supabase Postgres (RLS on every table; salary in a separate private table)
   ├── Supabase Storage (resumes, videos: private buckets; avatars: public)
   ├── Voice guide agent (browser SDK)
   │     └── client tools → run in the browser → write to Supabase with the
   │         user's own session, so RLS enforces ownership (section 4a)
   └── Next.js Route Handlers (/api/*), server-only
         ├── /api/agent/session     → checks Supabase session, mints an agent
         │                            signed URL, returns it + dynamic variables
         ├── /api/ai/parse-resume   → Claude API: resume file → structured draft
         └── /api/match/run         → deterministic scorer (service role), writes `matches`
Deploy: Vercel.
Env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY (server only),
     agent keys (see .env.example),
     ANTHROPIC_API_KEY (server only), NEXT_PUBLIC_SITE_URL.
```

**Why deterministic matching:** the % must be explainable to both parties and stable across reloads. Narrative ("why this is a fit") can come from the agent; the number never does.

**Supabase notes verified against the 2026 changelog:** new tables in `public` are no longer auto-exposed to the Data API, so the migration grants `anon`/`authenticated` explicitly. Free-tier projects created after 2026-06-03 cannot customise auth email templates without custom SMTP; the default confirm-signup email still works, but its link must point at `/auth/confirm` (set in Auth → URL Configuration, or accept the default `{{ .ConfirmationURL }}` and handle `/auth/callback` too). Next.js 16 uses `src/proxy.ts` (exported `proxy`) instead of `middleware.ts`.

### 4a. Voice guide agent contract

**Agents.** One agent in Tier 1: **Passport Guide** (employee onboarding + in-app helper). Tier 2 adds **Hiring Guide** for employers. Both are private (auth enabled) with a hostname allowlist (`localhost:3000`, the Vercel domain), so the browser must fetch a signed URL from `/api/agent/session` first.

**Session start.** The route verifies the Supabase session with `getClaims()`, asks the agent platform for a signed session URL with the server-side API key, and returns `{ signedUrl, dynamicVariables }`. Signed URLs last 15 minutes. Dynamic variables (referenced as `{{name}}` in the agent prompt):

| Variable | Example |
|---|---|
| `user_first_name` | "Nick" |
| `user_role` | "employee" |
| `profile_status` | "Saved: basics, abilities. Missing: accommodations, availability, story, history, salary." |

The agent never receives a user ID and never chooses who to write to. Client tools write with the browser's Supabase session, so the agent can only ever touch the signed-in user's rows.

**Client tools (Tier 1).** All registered in the dashboard with *Wait for response* on; names are case-sensitive and must match `src/lib/agent/client-tools.ts`. Lists are comma-separated strings because that is the most reliable parameter type across agent LLMs.

| Tool | Parameters | Effect | Returns |
|---|---|---|---|
| `get_profile_status` | none | reads own profile | plain-text summary of saved vs. missing sections |
| `save_basics` | `headline?` `city?` `state?` `remote_preference?` (`remote`/`in_person`/`either`) | upsert `employee_profiles` | "Saved. Missing: …" |
| `save_abilities` | `abilities` (comma-separated) | replace `abilities[]` | same |
| `save_accommodations` | `accommodations` (comma-separated) | replace `accommodations[]` | same |
| `save_availability` | `availability` (comma-separated) | replace `availability[]` | same |
| `save_story` | `about_raw` (their words), `about` (agent's professional rewrite, read back to the user for approval first) | upsert both columns | same |
| `add_history` | `kind` (`award`/`education`/`volunteer`), `title`, `org?`, `year?`, `details?` | append to the matching jsonb array | same |
| `save_salary` | `salary_min` (number), `salary_max` (number) | upsert `employee_private` | same |
| `finish_onboarding` | none | sets `searchable=true`, `passport_public=true`, ensures `passport_slug` | the public Passport URL |

**Agent prompt rules** (in the dashboard system prompt, kept in the agent setup notes outside the repo): one question at a time; plain language; always read a rewrite back before saving it; use "accommodations" for needs and "abilities" for skills; call `get_profile_status` at the start and after each save; stop after `finish_onboarding` and tell the user their Passport link.

**Text mode.** The in-app panel passes `textOnly: true` and uses `sendUserMessage`; onboarding offers a voice/text toggle before the session starts and asks for microphone permission only if voice is chosen.

**Match score (0–100)**, computed per (employee, job):

| Factor | Weight | Rule |
|---|---|---|
| Abilities overlap | 40 | Jaccard-style overlap of job `abilities_required` vs employee `abilities` |
| Accommodations covered | 25 | share of employee `accommodations` present in job `accommodations_offered` (100 if employee lists none) |
| Location / remote | 15 | full if remote-compatible or same city; half if same state |
| Availability | 10 | overlap of availability slots |
| Salary overlap | 10 | job range intersects employee range (private; computed server-side only) |

## 5. Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page | public |
| `/about`, `/privacy`, `/terms` | Static content pages | public |
| `/p/[slug]` | Ability Passport public card + QR | public (only if `passport_public`) |
| `/login`, `/signup`, `/auth/confirm`, `/auth/callback` | Auth flow | public |
| `/onboarding` | Role select, then role-specific steps | auth |
| `/app` | Role-aware dashboard | auth |
| `/app/profile` | Employee profile editor + resume upload | employee |
| `/app/matches` | Employee's matches with % | employee |
| `/app/employer` | Employer profile + job editor | employer |
| `/app/employer/jobs/[id]/candidates` | Ranked candidates, detail, feedback | employer |
| `/app/mentor` | Mentee list | mentor (Tier 2) |
| `/app/mentor/mentees/[id]` | Edit mentee profile | mentor (Tier 2) |
| `/app/messages/[matchId]` | Thread | both parties (Tier 2) |

## 6. Data model (Postgres, `public` schema)

- `profiles` — `id` (= auth.users.id), `role` (`employee` \| `employer` \| `mentor`), `full_name`, `avatar_url`, timestamps. Created by trigger on auth signup.
- `employee_profiles` — `user_id` PK, `headline`, `about` (AI-polished), `about_raw` (their words), `city`, `state`, `remote_preference` (`remote` \| `in_person` \| `either`), `availability text[]`, `abilities text[]`, `accommodations text[]`, `awards jsonb`, `education jsonb`, `volunteer jsonb`, `resume_path`, `video_path`, `passport_slug` unique, `passport_public bool`, `searchable bool`.
- `employee_private` — `user_id` PK, `salary_min`, `salary_max`. Readable by the owner and their mentors only. This table is what enforces "employers never see the number".
- `employer_profiles` — `user_id` PK, `company_name`, `description`, `website`, `city`, `state`, `accommodations_offered text[]`.
- `jobs` — `id`, `employer_id`, `title`, `description`, `abilities_required text[]`, `city`, `state`, `remote` (`remote` \| `in_person` \| `either`), `availability text[]`, `salary_min`, `salary_max` (visible to employees), `accommodations_offered text[]`, `status` (`open` \| `closed`).
- `matches` — `id`, `job_id`, `employee_id`, `score int`, `breakdown jsonb`, `employer_feedback` (`interested` \| `not_now` \| null), `employee_feedback` (same), timestamps. Unique on (`job_id`, `employee_id`).
- `mentor_profiles` — `user_id` PK, `bio`, `background_check` (`pending` \| `cleared` \| `not_started`).
- `mentorships` — `mentor_id`, `employee_id`, `status`. Grants mentors edit access to a mentee's profile via RLS.
- `messages` — `id`, `match_id`, `sender_id`, `body`, `created_at` (Tier 2).

**RLS summary:** owners read/write their own rows. `employee_profiles` where `searchable = true` are readable by employers. `/p/[slug]` reads through a `passport_public` policy for `anon`. Mentors read/write mentee rows only where an active `mentorships` row exists. `matches` readable by the employee and the job's employer. `employee_private` never readable by employers; the matcher uses the service role on the server.

## 7. Design system

- **Fonts:** Atkinson Hyperlegible (Google Fonts, designed for low-vision legibility) for everything.
- **Palette (placeholder until Delilah signs off, all in one tokens file):** green primary, coral CTA, yellow highlight, purple secondary, warm off-white paper, green-tinted ink. **No blue.** Every semantic pair is checked for contrast ≥ 4.5:1 and for deuteranopia/protanopia separation by lightness, not hue. Role color is always paired with an icon and a text label.
- **Components (shadcn/ui on Radix for accessible primitives):** Button, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Card, Badge, Dialog, Sheet, Tabs, Progress, Avatar, Separator, Toast. Custom: `ChipPicker` (abilities/accommodations), `StepFlow` (onboarding with visible progress), `MatchRing` (score display), `PassportCard`, `ChatPanel`, `SkipLink`.
- **Accessibility bar:** WCAG 2.2 AA. Minimum 44×44 px targets, visible focus rings, skip link, landmarks, `prefers-reduced-motion` respected, every icon-only control labelled, forms with inline plain-language errors, no time limits, one primary action per screen.

## 8. Error handling

- Auth errors surface as plain-language inline messages ("That email is already signed up. Try logging in.").
- AI routes fail soft: if parsing fails, the user still gets an empty editable profile with a message. Never block a flow on the AI.
- If the agent session cannot start (no key, allowlist, mic denied), onboarding falls back to the plain form-based profile editor with a one-line explanation. Client tools return an error string instead of throwing, so the agent can apologise and retry rather than crash the session.
- Uploads validate type/size client-side and server-side; max 10 MB resume, 100 MB video.
- Every route handler returns a typed `{ ok, data | error }` envelope.

## 9. Testing

- **Vitest** unit tests for `scoreMatch()`, profile validation schemas (Zod), and the client-tool handlers (parameter parsing, comma-list splitting, status summary text). These are the parts with logic.
- `eslint-plugin-jsx-a11y` in lint.
- Manual Lighthouse accessibility pass on landing, onboarding, candidates before demo.
- Seed script creates 1 employer with 2 jobs, 6 employees, 1 mentor, and runs the matcher so the demo has data on first load.

## 10. Dependencies on teammates

| Need | From |
|---|---|
| Final palette | Delilah |
| Landing copy: headline, FAQs, About, testimonial credits | Riya |
| Logo, Nik's final video file, social handles, domain | Maria |
| Employee/employer/mentor journey details beyond the notes | Mitron / Maya / Riya |
| Supabase project + Anthropic key (Istiqlal creates; team shares cost) | Istiqlal |

## 11. Out of scope

Payments, background-check integration, real SMS, admin panel, multi-language, native apps.
