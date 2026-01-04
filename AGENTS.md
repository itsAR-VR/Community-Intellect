
# AGENTS.md — Community Intellect (B2B CMO Club AI)

This file is for **coding agents** (and fast onboarding). It complements README.md (which is for humans).
If multiple AGENTS.md files exist, the **closest one to the code you’re editing wins**.

## Scope
- Applies to the entire repo unless overridden by a nested AGENTS.md.

## Reading order (do this first)
1) README.md (setup + auth/RBAC + AI model routing + deploy notes)
2) COMPLETEPROJECTPLAN (product spec + backlog + acceptance criteria)

## What we’re building (intent)
**Internal-only Retention Intelligence + Concierge Enablement Engine** for the B2B CMO Club.

Non-negotiables:
- Evidence-backed “truth profile” per member (every important fact has provenance).
- Weekly forced-success engine (≥ 1 value drop/member/week).
- Live external signals on a scheduled loop (public-only sources; store summaries + links, not raw dumps).
- Message drafting + safety gating (no spam/double-send; conversation-aware).
- Dashboard is the CM’s command center; no member-facing chatbot in Phase 1.

## Current status (handoff baseline)
As of the handoff notes (2026-01-03):
- Tenant-scoped CRM surfaces exist: Members, Attention, Opportunities, Drafts, Forced Success, Intros, Perks, Programming, Pods, Surveys, Resources, AI Chat.
- Persisted tenant settings + Settings UI wired to API.
- Velocity analytics tables + UI (velocity challenges/proofs).
- Admin-only role management RPC exists (admin_set_user_role).
- Playwright smoke tests exist and run against the deployed URL.

## Repo shape (high-level)
- Next.js App Router
  - UI pages live under `app/app/[tenantId]/*`
  - Auth routes: `/login` etc
- Server routes
  - AI routes: `app/app/api/ai/*`
  - Other server routes are tenant-scoped and must enforce RBAC + tenant gating
- Data layer
  - Supabase Postgres is canonical
  - RLS + security-definer functions are part of the product, not “optional hardening”

## Commands (use these, in this order)
### Local dev
```bash
pnpm install
cp .env.example .env.local
pnpm dev
````

Open:

* [http://localhost:3000](http://localhost:3000)
* Sign in at `/login`
* Expected landing: `/app/b2b/overview`

### DB seed (dev-only)

```bash
pnpm db:seed
# wipe + reseed
pnpm db:seed:force
```

### QA

#### Manual QA (preferred for UI work)

* Login and verify tenant landing.
* Sidebar navigation loads the main pages.
* Create flows: Members, Pods, Programming, Surveys.
* Settings: toggle/save, refresh, confirm persisted.
* Analytics: Wrapped + Velocity render correctly.
* Global search (cmd/ctrl+k): “Pending Drafts” shows correct member context.

#### E2E (live smoke tests)

Playwright runs **against deployed app** using `NEXT_PUBLIC_APP_URL` (not localhost):

```bash
pnpm e2e
```

Optional (if present): gate any data-creating checks behind explicit env flags
(e.g. `E2E_CHECK_CREATE_DIALOGS=1`) so smoke tests stay non-destructive by default.

## Environment variables (don’t leak secrets)

Client-safe:

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* NEXT_PUBLIC_APP_URL (also used for live QA / Playwright targeting)

Server-only (NEVER expose to browser):

* SUPABASE_SERVICE_ROLE_KEY
* OPENAI_API_KEY
* Any OAuth tokens / integration secrets (Slack, LinkedIn, etc.)
* CRON_SECRET (if/when cron endpoints are added)

## Supabase rules (critical)

* Treat Supabase as the **source of truth**.
* RLS/RBAC policies, grants/revokes, triggers, PostgREST behavior belong in SQL migrations.
* Prefer adding/altering SQL migrations vs “moving RLS into application code”.

RBAC baseline:

* roles: `admin` | `community_manager` | `read_only` (from `public.profiles.role`)
* tenant access: `public.tenant_users`
* Every tenant-scoped query MUST enforce tenant gating.

## AI rules (critical)

### Model routing

Use env-configured tiering:

* OPENAI_MODEL_LIGHT (classification/tagging)
* OPENAI_MODEL_STANDARD (drafts/summaries)
* OPENAI_MODEL_COMPLEX (deep synthesis / AI chat)

### Evidence and provenance

When generating:

* member summaries
* suggested actions
* drafted messages
  the output MUST:
* reference evidence (source + timestamp + link/ID where possible)
* clearly label unknowns (never invent facts)
* keep outputs concise unless explicitly asked to expand

### Safety guardrails for outbound drafts

* Follow the “conversation-aware” sending rules (no double-send).
* Default to **draft-only** unless a route is explicitly “send” and includes gating + audit logging.
* Never send secrets or internal-only data in messages.

## Workflows for agents (how to operate in this repo)

### Planning protocol (recommended)

* Start by stating: which page/route/table you’re touching, what “done” means, and how you’ll test.
* Prefer small diffs that keep RLS + app changes in the same PR when relevant.

### Session handoff (copy/paste friendly)

At the end of a work session, leave:

* What changed (files/areas)
* How to verify (commands + URLs)
* What’s next (1–3 bullets)
* Any gotchas (env vars, RLS policy implications)

## Integrations roadmap (near-term)

1. Make integrations real (currently many are toggles/settings)

   * secure token storage (server-only)
   * ingestion pipelines (webhooks + polling)
   * normalized tenant-scoped “events” tables
2. Background jobs / cron

   * Vercel Cron (or Supabase scheduled functions)
   * signed secret (CRON_SECRET)
   * idempotency keys + audit events
3. Admin UX

   * role management UI
   * tenant membership management
4. Product hardening

   * rate limiting on AI routes
   * structured logging + request IDs + health endpoint
5. Expand Playwright coverage (non-destructive by default)

## MCP tooling (from your config)

Use these when appropriate:

* context7: quick docs lookups for libraries/frameworks
* GitHub MCP: issues/PRs/code search workflows
* playwright MCP: browser automation + debugging
* supabase MCP: inspect DB tables, policies, and verify migrations
* jam: capture/share repro steps for UI bugs
* web search: compare patterns / best practices (e.g., AGENTS.md conventions)

