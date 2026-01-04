-- Community Intellect - Cron job run tracking (idempotency + observability)

begin;

create table if not exists public.cron_job_runs (
  id bigint generated always as identity primary key,
  job_name text not null,
  run_key text not null,
  status text not null default 'started' check (status in ('started','success','error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  details jsonb not null default '{}'::jsonb
);

create unique index if not exists cron_job_runs_job_name_run_key_idx
  on public.cron_job_runs(job_name, run_key);

alter table public.cron_job_runs enable row level security;

commit;

