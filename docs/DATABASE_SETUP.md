# ConnectAble Database Setup

Create `.env.local` from `.env.example`. The Supabase URL and publishable key are public project identifiers and are already included. Add newly rotated server credentials locally. Do not paste them into source files, commits, screenshots, or issue comments.

Apply these migrations in order:

1. `20260905192406_init.sql` is the shared product foundation for accounts, profiles, jobs, matches, mentorships, messages, RLS, and storage.
2. `20260905230000_phase_0_2_backend.sql` adds consent timestamps, 150 abilities, 30 accommodations, mentor drafts and endorsements, moderation, applications, background jobs, communications, audit protection, usage records, and the reset function.
3. `20260906000100_mentor_check_ins.sql` adds scheduled mentor check-ins. The protected scheduling API queues a confirmation email to the mentee after it verifies the active, consented relationship.

Set `DATABASE_URL` to the project's session-pooler connection string, then run `npm run db:migrate`. The runner records checksums in `public.schema_migrations`, recognizes an existing shared foundation, applies pending files in order, and prints verified taxonomy and demo counts. Then run `npm run seed` to create or update the fictional demo accounts and records.

Set a scheduled request to `POST /api/cron/drain` with `Authorization: Bearer <CRON_SECRET>`. Set GHL to call `POST /api/webhooks/ghl` with the dedicated `x-webhook-secret`. Never reuse the integration key as the webhook secret.
