# Community Intellect (B2B CMO Club AI)

Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui, backed by Supabase (Postgres + Auth + RLS) and OpenAI.

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

## E2E (Live smoke tests)

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
