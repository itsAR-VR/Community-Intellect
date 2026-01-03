# Community Intellect (B2B CMO Club AI)

Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui, backed by Supabase (Postgres + Auth + RLS) and OpenAI.

## Current status (handoff-ready)

As of `2026-01-03` (git `2fa92fc`), the app supports:

- Tenant-scoped core CRM: members, attention, opportunities, drafts, intros, perks, pods, surveys, resources, forced success.
- Persisted tenant settings (`public.tenant_settings`) + Settings UI wired to API.
- Programming CRUD + “send” actions (server routes) and Surveys send.
- Velocity analytics backed by `public.velocity_challenges` + `public.velocity_proofs`.
- Global search includes “Pending Drafts” with correct member context.
- Admin-only role management RPC: `public.admin_set_user_role(...)`.
- Live smoke tests via Playwright (`pnpm e2e`) that target the deployed URL (not localhost).

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`, sign in at `/login`, and you should land on `/app/b2b/overview`.

## Supabase (DB + Auth)

### 1) Create a Supabase project

- Create a project in Supabase.
- Copy your project URL and keys into `.env.local`.

### 2) Apply schema + RLS

- Run these migrations (in order) in the Supabase SQL editor (or via the Supabase CLI if you use it):
  - `supabase/migrations/0001_init.sql`
  - `supabase/migrations/0002_fix_chat_threads_created_by_default.sql`
  - `supabase/migrations/0003_tenant_settings_and_velocity.sql`

This creates tenant-scoped tables (members, facts, signals, drafts, etc), enables RLS, and adds RBAC policies via `public.profiles` + `public.tenant_users`.

If you just created/modified tables and PostgREST can’t see them yet, refresh the schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### 3) Seed dev data (from `lib/mock-data.ts`)

```bash
pnpm db:seed
```

- Requires `SUPABASE_SERVICE_ROLE_KEY` (server-only) in `.env.local`.
- Optional: set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` to create an admin user and grant access to seeded tenants.
- To wipe and reseed:

```bash
pnpm db:seed:force
```

## Why SQL migrations (and not “Prisma for everything”?)

This project relies on Postgres features that an ORM typically does not (and should not) manage end-to-end:

- RLS policies, security-definer RPCs, grants/revokes, triggers, and PostgREST behavior are best expressed in SQL.
- Prisma can be added later for server-side querying convenience, but it won’t replace:
  - RLS/RBAC policy definitions
  - `security definer` functions
  - tenant access checks and grants

If the “manual SQL editor” workflow is the pain point, the best next step is using the Supabase CLI migrations pipeline (apply/rollback in CI), not moving RLS into application code.

## Auth + RBAC

- Supabase Auth is used for sessions.
- User roles come from `public.profiles.role` (`admin` | `community_manager` | `read_only`).
- Tenant access comes from `public.tenant_users`.
- `/app/*` is protected by `middleware.ts`.

## AI

AI routes live under `app/app/api/ai/*` and are routed by task:

- `OPENAI_MODEL_LIGHT` → `gpt-5-nano` (classification/tagging)
- `OPENAI_MODEL_STANDARD` → `gpt-5-mini` (drafting/summaries)
- `OPENAI_MODEL_COMPLEX` → `gpt-5.1` (AI chat / deeper synthesis)

## QA

### Manual QA checklist (live)

- Login (`/login`) and verify tenant landing (`/app/b2b/overview`).
- Sidebar navigation: Overview, Members, Attention, Opportunities, Drafts, Forced Success, Intros, Perks, Programming, Pods, Surveys, Resources, AI Chat.
- Members:
  - Search/filter/sort table.
  - “Add Member” creates a record and shows in table.
- Pods:
  - Create pod and confirm it persists.
- Surveys:
  - Send survey; verify success toast and audit event.
- Programming:
  - Create session/event; send; verify it persists.
- Settings:
  - Toggle/save settings; refresh page and confirm values persist.
- Analytics:
  - Wrapped renders and copy works.
  - Velocity shows challenges/proofs backed by DB.
- Global Search (cmd/ctrl+k): “Pending Drafts” shows member name + draft title.

### E2E (live smoke tests)

Playwright smoke tests run **against the deployed app** via `NEXT_PUBLIC_APP_URL` (not localhost).

```bash
pnpm e2e
```

Required env vars:
- `NEXT_PUBLIC_APP_URL`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

Optional:
- `E2E_CHECK_CREATE_DIALOGS=1` to validate create dialogs open (still non-destructive).

## Deploy (Vercel)

- Set all variables from `.env.example` in Vercel Project Settings.
- Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the client.

## Implementation plan (next steps)

### 1) Make integrations real (currently mostly “settings toggles”)

- Define per-tenant integration configs (Slack, LinkedIn, etc.) in `public.tenant_settings` (or dedicated tables for tokens + scopes).
- Add secure OAuth / token storage patterns (server-only), plus connection status in Settings UI.
- Add ingestion pipelines (webhooks + polling) and write normalized “events” into tenant-scoped tables.

### 2) Background jobs / cron

- Add a scheduler for:
  - automatic survey sends
  - recurring “programming” reminders
  - daily/weekly rollups (attention/opportunities)
- Use a signed secret (`CRON_SECRET`) + Vercel Cron (or Supabase scheduled functions) to call server routes.
- Ensure idempotency (job keys) + audit events for every automated action.

### 3) Admin & RBAC UX

- Build an admin UI for:
  - assigning roles (`admin_set_user_role`)
  - managing `tenant_users` membership
  - viewing tenant settings and health
- Expand audit logging coverage for new create/send routes (members/pods/surveys/programming/velocity).

### 4) Product hardening

- Error handling + empty states across every page (especially create/send flows).
- Rate limiting / abuse protections on AI endpoints.
- Observability: structured logs, request IDs, and a simple “health” endpoint for checking Supabase + OpenAI connectivity.

### 5) Broaden automated QA

- Add more non-destructive Playwright checks (navigation, key pages load, settings GET, search results render).
- Gate any data-creating tests behind explicit env flags (similar to `E2E_CHECK_CREATE_DIALOGS`).

## New-agent handoff (copy/paste)

Use this when starting a new chat with another agent:

- Repo: `Community-Intellect` (Next.js App Router, Supabase, OpenAI), latest known good commit `2fa92fc` on `main`.
- DB: run migrations `supabase/migrations/0001_init.sql`, `0002_fix_chat_threads_created_by_default.sql`, `0003_tenant_settings_and_velocity.sql` (0003 already applied successfully).
- Env: use `.env.example`; ensure `NEXT_PUBLIC_APP_URL` points at Vercel for live QA; keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` server-only.
- QA: run `pnpm e2e` (live-only). Optional `E2E_CHECK_CREATE_DIALOGS=1` for dialog checks.
- Key new features: persisted settings, programming/surveys send, velocity DB tables + UI, global search pending drafts fix, admin role RPC.
- Next work: real integrations + background jobs/cron + admin UX + hardening + expanded E2E.
