# Phase 0 and Phase 2 Test Report

Date: September 5, 2026

## Passed checks

- TypeScript completed with no errors.
- Vitest passed 48 tests in 12 files. These cover the existing product, environment validation, bearer and JSON request boundaries, database migration invariants, mentor access for active, missing, unconsented, ended, and wrong-role relationships, interactive mentor demo follow-ups, and scheduled check-in email validation and formatting.
- The optimized Next.js 16 production build completed and generated all existing application pages plus every Phase 0/2 API route.
- The production HTTP smoke suite passed 20 checks across the home page, health endpoint, every API route, authenticated validation boundaries, structured errors, and the not-found response.
- The local stress suite completed 6,000 requests with no transport, timeout, or unexpected-status failures.

## Stress measurements

| Workload | Requests | Concurrency | Requests/second | p50 | p95 | p99 | Max | Failures |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Health endpoint | 3,000 | 100 | 384.5 | 222.2 ms | 467.8 ms | 644.2 ms | 799.4 ms | 0 |
| All authentication guards | 3,000 | 75 | 320.6 | 222.5 ms | 302.5 ms | 374.3 ms | 389.9 ms | 0 |

These are local development-machine measurements and are useful for regression comparison. They are not production capacity estimates because they exclude network latency and database work.

## Live Supabase result

The configured Supabase authentication health endpoint returned HTTP 200. The live database still rejected the supplied password through the confirmed `us-west-2` pooler, so the new migration and seed have not been applied remotely.

As a result, successful authenticated mentor workflows, reseeding, concurrent database job claims, GHL/Gmail delivery, and Anthropic calls have not been exercised end to end. Those checks require the migrations to be applied with a working database password and should use test recipients and degraded model mode until outbound integrations are intentionally enabled.
