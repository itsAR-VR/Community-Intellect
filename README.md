# Community Intellect (B2B CMO Club AI)

Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui, backed by Supabase (Postgres + Auth) + Prisma and OpenAI.

Full product spec and backlog lives in `COMPLETEPROJECTPLAN`.

## Current status (handoff-ready)

As of `2026-01-04`, the app supports:

- Single-club core CRM (still tenant-scoped in DB): members, attention, opportunities, drafts, intros, perks, pods, surveys, resources, forced success.
- Persisted club settings (`public.tenant_settings`) + Settings UI wired to API.
- Programming CRUD + “send” actions (server routes) and Surveys send.
- Velocity analytics backed by `public.velocity_challenges` + `public.velocity_proofs`.
- Global search includes “Pending Drafts” with correct member context.
- Admin-only role management for `public.profiles.role`.
- Live smoke tests via Playwright (`pnpm e2e`) that target the deployed URL (not localhost).

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000`, sign in at `/login`, and you should land on `/app/overview`.

## Supabase (Auth) + Postgres (Prisma)

### 1) Create a Supabase project

- Create a project in Supabase.
- Copy your project URL and keys into `.env.local`.

### 2) Configure env vars

- Supabase Auth (client + server auth checks):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Database (Prisma):
  - `DATABASE_URL` (runtime pooled connection)
  - `DIRECT_URL` (direct connection for Prisma CLI migrations)

### 3) Apply DB schema (Prisma migrations)

Migrations live in `prisma/migrations` and are applied via Prisma (no Supabase SQL editor workflow).

```bash
pnpm db:migrate
pnpm db:generate
```

If you point Prisma at an existing Supabase database that already has tables (non-empty schema), `prisma migrate deploy` may fail with `P3005` (“database schema is not empty”). Baseline it once:

```bash
pnpm prisma migrate resolve --applied 20260104123000_init
pnpm db:migrate
```

### 4) Seed dev data (from `lib/mock-data.ts`)

```bash
pnpm db:seed
```

- Optional: set `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` to create an admin user and grant access to the seeded club tenant.
  - If you set these, you also need `SUPABASE_SERVICE_ROLE_KEY` (server-only) so the seed can create the Supabase Auth user.
- To wipe and reseed:

```bash
pnpm db:seed:force
```

## Data access model (Prisma-first)

- All application reads/writes go through Prisma (direct Postgres).
- Supabase is used for Auth only (sessions + login).
- Because Prisma does not automatically carry Supabase JWT claims into Postgres, the app enforces tenant/role access in application code (via `whoami` + tenant scoping).

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

- Login (`/login`) and verify landing (`/app/overview`).
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

## Cron (Vercel Cron Jobs)

Cron schedules are configured in `vercel.json` and call server routes under `app/api/cron/*`.

- Auth: cron routes require `Authorization: Bearer $CRON_SECRET` (Vercel Cron Jobs automatically send this header).
- Idempotency/observability: runs are tracked in `public.cron_job_runs` (created by Prisma migrations).
- Per-tenant enablement (stored in `public.tenant_settings.settings`, editable in Settings UI by admins/community managers):
  - Surveys autosend: set `automation.surveys.enabled = true` and optionally `automation.surveys.cadence` (`weekly|biweekly|monthly|quarterly`) and `automation.surveys.maxPerRun`.
  - Programming reminders: set `automation.programmingReminders.enabled = true`.

Manual trigger (example):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://community-intellect.vercel.app/api/cron/surveys?dryRun=1"
```

To enable automation without the UI, you can also run the SQL in `supabase/scripts/enable_automation.sql` (optional).
