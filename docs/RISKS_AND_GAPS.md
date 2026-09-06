# ConnectAble Backend Risks and Gaps

## Permission split

A mentor role grants access to no employee by itself. Authorization depends on one active relationship with recorded consent and no revocation. Tests cover unrelated, revoked, never-consented, and wrong-role access.

Mentor ability suggestions stay drafts. Confirmed endorsements verify what the mentor observed, while employee publication remains separate. The current Phase 0 and Phase 2 scope does not include the employee route that grants or revokes a relationship or publishes a draft.

## Sensitive data and evidence

Employers have no direct policy for private evidence, captions, accommodations, mentor relationships, or audit records. Caption approval requires reviewed text. Rejection requires a reason. Storage upload constraints and signed evidence URLs belong to the employee evidence phase and are not implemented here.

## Deployment gaps

The Supabase project has a publishable key, but this repository still needs a newly rotated database password, service-role key, Anthropic key, GHL credentials, Gmail app password, and webhook secret in the deployment environment. Migrations cannot be applied safely with stale credentials from a shared guide.

Gmail has daily sending limits. The communication queue deduplicates messages, but a production rollout should use a transactional provider with delivery callbacks. The GHL inbound payload schema is intentionally narrow; confirm the exact webhook signature header in the live sub-account before enabling it.

Model pricing can change. The current estimator uses the documented Sonnet input and output rates and should be updated when the configured model changes.
