# Internal Website Testing

## Checks available now

1. In the project folder, run `npm run build` and then `npm start`.
2. Open `http://localhost:3000`. The ConnectAble home page should load.
3. Open `http://localhost:3000/api/health`. It should return:

   ```json
   {"status":"ok","service":"connectable","phases":[0,2]}
   ```

4. Open `http://localhost:3000/api/coach/participants` in a private browser window. It should return HTTP 401 with a structured `unauthenticated` error. This confirms the mentor data is not public.
5. Open `http://localhost:3000/api/moderation/queue` in the same private window. It should also return HTTP 401.

Run `npm run test:smoke` for the equivalent check across every API route. Run `npm run test:stress` to repeat the public and protected checks under concurrent load.

## Mentor workspace demo

1. Sign in with the existing mentor account and open `http://localhost:3000/app`.
2. Choose **View demo profile** for any of the five sample mentees.
3. In **Mentor follow-up**, use **Mark complete** to close the displayed follow-up or **Record check-in** to log a check-in.
4. Add a note in **Private mentor note**. It is explicitly marked **Visible only to mentors.**
5. Add a factual observation in **Draft an ability observation**, then save it. The interface explains that the mentee must review and publish it.

These actions are intentionally browser-local demo data while the live Supabase migration remains unapplied. The protected Phase 2 API routes provide the persistent version once the database is migrated and seeded.

## Live check-in email setup

1. Apply both database migrations, including `20260906000100_mentor_check_ins.sql`.
2. Set the server-only `SUPABASE_SECRET_KEY`, `CRON_SECRET`, `GMAIL_USER`, and `GMAIL_APP_PASSWORD` environment variables in the deployment environment. Do not put them in browser-exposed `NEXT_PUBLIC_` variables.
3. Configure a scheduler to call `POST /api/cron/drain` with `Authorization: Bearer <CRON_SECRET>` at least once a minute.
4. A signed-in mentor can then send `POST /api/coach/participants/<participant-id>/check-ins` with a future ISO `startsAt`, IANA `timeZone`, optional `location`, and `durationMinutes`. The API queues the check-in confirmation to that mentee's account email.

The sample profiles use browser-only data and intentionally do not send email. Use a fictional test recipient for the first live scheduling check.

## Full mentor acceptance test after frontend integration

Use fictional accounts and records only.

1. Invite a test mentor through the server-side admin process and accept the invitation. Confirm there is no public mentor-registration option.
2. Sign in as that mentor. Confirm the dashboard lists only employees with an active mentoring relationship, granted consent, and no revocation.
3. Try navigating directly to an unrelated employee's profile URL. Confirm the website displays an access-denied state and the network response is HTTP 403.
4. Open an assigned employee. Confirm abilities, applications, accommodations, and endorsements load.
5. Suggest an ability. Confirm it is labeled as mentor-added, remains a draft, and is not employer-visible.
6. Add an endorsement with an observation and support level. Confirm the mentor's name is visible in the attribution.
7. Review an AI-suggested ability. Confirm approval leaves it as a employee-owned draft rather than publishing it.
8. Approve and reject test evidence. Confirm rejection requires a reason and both decisions record the mentor attribution.
9. Review a machine-generated caption. Confirm approval requires reviewed text and preserves the original generated text.
10. Revoke the mentoring relationship from the employee flow, then refresh the mentor page and retry its direct URL. Access should stop immediately.
11. Publish a reviewed draft from the employee flow. Confirm the employer-facing view shows only the employee-published version.
12. Enable degraded model mode in the deployment environment. Confirm the site supplies the canned review guidance and continues operating without a model request.

The employee publish and consent-revocation steps depend on Phase 1. The employer visibility check depends on Phase 3. Until those phases are connected, verify the corresponding backend restriction through the automated access tests.
