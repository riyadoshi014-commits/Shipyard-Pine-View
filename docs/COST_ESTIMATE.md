# What this costs to run — for Inclusion Revolution

Written for whoever at the nonprofit picks this up after the hackathon. Every number below is either a documented free-tier limit or a stated assumption — nothing is a guess dressed up as a fact. Update this file once real usage is measured; it's a starting estimate, not a bill.

## The short version

**At the scale this pilot needs (a few dozen participants, a handful of employers), this runs for $0–15/month.** The only place cost can grow unexpectedly is the AI usage on high-traffic paths (resume parsing, the SMS agent, the interview copilot) if usage is much higher than expected — see "Watch this" below.

## Itemized

| Service | What it's for | Free tier | Cost at pilot scale |
|---|---|---|---|
| Vercel (hosting) | The Next.js app itself | Hobby plan free for non-commercial/small projects | $0, until traffic or team size requires Pro (~$20/mo) |
| Supabase | Database, auth, file storage | Free tier: 500MB database, 500MB storage, 50k monthly active users | $0 at this scale. **Free projects auto-pause after 7 days idle** — if nobody logs in for a week, the next visitor sees a "waking up" delay. Fine for a live pilot, worth knowing about for a quiet week. |
| Anthropic API | Resume parsing, SMS replies, interview copilot, onboarding voice-agent's underlying text | No free tier; pay-per-token | See below — this is the one variable cost |
| ElevenLabs | Voice for the Passport Guide onboarding agent | Free tier: ~15 min/month | Likely needs a paid tier (~$5–22/mo) once more than a couple of people onboard by voice per month |
| GoHighLevel (SMS) | The "recruiter that works for you" text agent | Not free — existing sub-account | Per-message SMS cost (carrier-dependent) + monthly number fee, typically $20–50/mo depending on the plan already in place |
| Domain (connectable.work) | — | — | ~$15–20/year |
| Gmail (transactional email) | Signup/confirmation emails | Free, ~500 sends/day cap | $0, but don't run a bulk email job through it |

## The one variable: Anthropic API usage

Rough, current per-token pricing (see docs/BACKEND_ARCHITECTURE.md §5.1 for the model-routing rationale):

| Task | Model | Frequency |
|---|---|---|
| Resume parse | Sonnet 5 | Once per resume upload |
| SMS reply | Haiku 4.5 (cheapest tier) | Once per inbound text |
| Interview copilot suggestion | Sonnet 5 | Once per "suggest a question" click |

**At pilot scale — say 50 resume parses, 200 SMS exchanges, and 100 copilot suggestions in a month — this is comfortably under $5.** The number that actually matters is *messages per active user per month*, not headcount. If SMS becomes the primary way participants interact (which the product intends), that's the line to watch as adoption grows.

## Watch this

- **Set a hard spend limit on the Anthropic API key** in the Anthropic console before this goes live with real users — a runaway loop (a bug, or someone testing repeatedly) is the only realistic way this bill surprises anyone.
- **Supabase free-tier storage (500MB)** fills up fastest from uploaded resumes and profile videos, not database rows. If video uploads become common, budget for the next storage tier (~$25/mo for the next size up) sooner than the database limit would suggest.
- **GoHighLevel's cost is whatever the sub-account is already paying** — this project didn't add a new SMS cost, it uses an existing account. Confirm with whoever owns that account what the current plan and per-message rate actually is; the number above is a placeholder, not a quote.

## What this means for a grant application

If this needs to be costed out for a funder: **$0–15/month in infrastructure, plus whatever the existing GoHighLevel plan already costs**, is a defensible number to put in front of Gulf Coast Community Foundation, Giving Partner funders, or a VR innovation grant. It scales roughly linearly with usage, not headcount — the honest caveat to state alongside it is that nobody has measured real usage yet, so this is a first-week estimate.
