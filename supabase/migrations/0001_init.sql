-- Community Intellect - Supabase schema (init)
-- This migration is intended to be applied via Supabase CLI or SQL editor.

begin;

-- Extensions
create extension if not exists pgcrypto;

-- ============================================================================
-- Enums
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'community_manager', 'read_only');
  end if;
end $$;

-- ============================================================================
-- Core: tenants + profiles + memberships
-- ============================================================================

create table if not exists public.tenants (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'read_only',
  default_tenant_id text references public.tenants(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  tenant_id text not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_users_user_id_idx on public.tenant_users(user_id);

-- ============================================================================
-- Helpers for RLS
-- ============================================================================

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin'::public.user_role
$$;

create or replace function public.is_writer()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('admin'::public.user_role, 'community_manager'::public.user_role)
$$;

create or replace function public.has_tenant_access(_tenant_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.tenant_users tu
    where tu.tenant_id = _tenant_id
      and tu.user_id = auth.uid()
  )
$$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Domain tables (tenant-scoped)
-- ============================================================================

create table if not exists public.members (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  avatar_url text,
  linkedin_url text,

  company_name text not null,
  company_role text not null,
  company_website text,
  company_stage text,
  company_headcount text,
  company_industry text,

  status text not null check (status in ('lead','accepted','active','churned','paused')),
  joined_at timestamptz not null,
  renewal_date timestamptz,

  risk_tier text not null check (risk_tier in ('green','yellow','red')),
  risk_score int not null check (risk_score between 0 and 100),
  engagement_score int not null check (engagement_score between 0 and 100),
  last_engagement_at timestamptz,

  contact_state text not null check (contact_state in ('open','closed','muted')),
  last_contacted_at timestamptz,
  last_value_drop_at timestamptz,

  onboarding jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_tenant_id_idx on public.members(tenant_id);
create index if not exists members_email_idx on public.members(email);
create trigger members_set_updated_at before update on public.members
for each row execute function public.set_updated_at();

create table if not exists public.facts (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  category text not null,
  key text not null,
  value text not null,
  confidence int not null check (confidence between 0 and 100),
  provenance text not null,
  evidence jsonb,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists facts_tenant_id_idx on public.facts(tenant_id);
create index if not exists facts_member_id_idx on public.facts(member_id);
create trigger facts_set_updated_at before update on public.facts
for each row execute function public.set_updated_at();

create table if not exists public.external_signals (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  source text not null,
  type text not null,
  what_happened text not null,
  implied_needs text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  urgency int not null check (urgency between 1 and 10),
  confidence int not null check (confidence between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists external_signals_tenant_id_idx on public.external_signals(tenant_id);
create index if not exists external_signals_member_id_idx on public.external_signals(member_id);
create index if not exists external_signals_created_at_idx on public.external_signals(created_at desc);

create table if not exists public.opportunities (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  summary text not null,
  tags text[] not null default '{}'::text[],
  urgency int not null check (urgency between 1 and 10),
  confidence int not null check (confidence between 0 and 100),
  source text not null,
  signal_id text,
  recommended_actions jsonb not null default '[]'::jsonb,
  dismissed boolean not null default false,
  dismissed_at timestamptz,
  dismissed_by text,
  created_at timestamptz not null default now()
);

create index if not exists opportunities_tenant_id_idx on public.opportunities(tenant_id);
create index if not exists opportunities_member_id_idx on public.opportunities(member_id);
create index if not exists opportunities_dismissed_idx on public.opportunities(dismissed);

create table if not exists public.message_drafts (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  action_type text not null,
  subject text,
  content text not null,
  impact_score int not null check (impact_score between 0 and 100),
  autosend_eligible boolean not null default false,
  blocked_reasons text[] not null default '{}'::text[],
  send_recommendation text not null check (send_recommendation in ('send','review','hold')),
  status text not null check (status in ('pending','approved','sent','merged','discarded')),
  merged_with_id text,
  generated_from_opportunity_id text,
  generated_from_action_id text,
  edited_at timestamptz,
  edited_by text,
  sent_at timestamptz,
  sent_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_drafts_tenant_id_idx on public.message_drafts(tenant_id);
create index if not exists message_drafts_member_id_idx on public.message_drafts(member_id);
create index if not exists message_drafts_status_idx on public.message_drafts(status);
create trigger message_drafts_set_updated_at before update on public.message_drafts
for each row execute function public.set_updated_at();

create table if not exists public.forced_success_items (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  week_of text not null,
  recommended_action_type text not null,
  recommended_actions jsonb not null default '[]'::jsonb,
  delivered_action_type text,
  delivered_at timestamptz,
  delivered_by text,
  draft_id text,
  blocked boolean not null default false,
  blocked_reason text,
  created_at timestamptz not null default now()
);

create index if not exists forced_success_items_tenant_week_idx on public.forced_success_items(tenant_id, week_of);
create index if not exists forced_success_items_member_idx on public.forced_success_items(member_id);

create table if not exists public.intro_suggestions (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_a_id text not null references public.members(id) on delete cascade,
  member_b_id text not null references public.members(id) on delete cascade,
  rationale text not null,
  impact_score int not null check (impact_score between 0 and 100),
  matching_fact_ids text[] not null default '{}'::text[],
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists intro_suggestions_tenant_idx on public.intro_suggestions(tenant_id);

create table if not exists public.intro_records (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_a_id text not null references public.members(id) on delete cascade,
  member_b_id text not null references public.members(id) on delete cascade,
  status text not null check (status in ('suggested','pending','accepted','declined','completed')),
  suggestion_id text,
  message_to_a text,
  message_to_b text,
  outcome_a jsonb,
  outcome_b jsonb,
  created_by text not null default auth.uid()::text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists intro_records_tenant_idx on public.intro_records(tenant_id);

create table if not exists public.perks (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text not null,
  description text not null,
  category text not null,
  partner_name text not null,
  partner_logo text,
  value text,
  url text,
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists perks_tenant_idx on public.perks(tenant_id);

create table if not exists public.perk_recommendations (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  perk_id text not null references public.perks(id) on delete cascade,
  rationale text not null,
  impact_score int not null check (impact_score between 0 and 100),
  matching_fact_ids text[] not null default '{}'::text[],
  dismissed boolean not null default false,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists perk_recommendations_tenant_idx on public.perk_recommendations(tenant_id);
create index if not exists perk_recommendations_member_idx on public.perk_recommendations(member_id);

create table if not exists public.perk_partner_applications (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  perk_description text not null,
  status text not null check (status in ('pending','approved','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists perk_partner_applications_tenant_idx on public.perk_partner_applications(tenant_id);
create trigger perk_partner_applications_set_updated_at before update on public.perk_partner_applications
for each row execute function public.set_updated_at();

create table if not exists public.mastermind_groups (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text not null,
  theme text,
  member_ids text[] not null default '{}'::text[],
  leader_id text not null references public.members(id),
  next_session_at timestamptz,
  rotation_schedule text[] not null default '{}'::text[],
  agenda_draft text,
  follow_up_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mastermind_groups_tenant_idx on public.mastermind_groups(tenant_id);

create table if not exists public.monthly_agendas (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  month text not null,
  themes text[] not null default '{}'::text[],
  template text not null,
  speakers jsonb not null default '[]'::jsonb,
  workshops jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, month)
);

create index if not exists monthly_agendas_tenant_idx on public.monthly_agendas(tenant_id);
create trigger monthly_agendas_set_updated_at before update on public.monthly_agendas
for each row execute function public.set_updated_at();

create table if not exists public.workshop_plans (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  topic text not null,
  suggested_speakers jsonb not null default '[]'::jsonb,
  target_audience text[] not null default '{}'::text[],
  status text not null check (status in ('idea','planning','scheduled','completed')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workshop_plans_tenant_idx on public.workshop_plans(tenant_id);

create table if not exists public.pods (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text not null,
  member_ids text[] not null default '{}'::text[],
  monthly_goals_prompt_sent boolean not null default false,
  monthly_goals_received text[] not null default '{}'::text[],
  receipts_shared text[] not null default '{}'::text[],
  quiet_member_ids text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists pods_tenant_idx on public.pods(tenant_id);

create table if not exists public.surveys (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  cadence text not null check (cadence in ('weekly','biweekly','monthly','quarterly')),
  last_sent_at timestamptz,
  last_completed_at timestamptz,
  completion_rate int not null default 0 check (completion_rate between 0 and 100),
  responses jsonb not null default '[]'::jsonb
);

create index if not exists surveys_tenant_idx on public.surveys(tenant_id);
create index if not exists surveys_member_idx on public.surveys(member_id);

create table if not exists public.resources (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null,
  tags text[] not null default '{}'::text[],
  url text,
  content text,
  attachment_url text,
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resources_tenant_idx on public.resources(tenant_id);
create trigger resources_set_updated_at before update on public.resources
for each row execute function public.set_updated_at();

create table if not exists public.audit_logs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  type text not null,
  actor_id text not null default auth.uid()::text,
  actor_role public.user_role,
  actor_label text,
  member_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_tenant_idx on public.audit_logs(tenant_id);
create index if not exists audit_logs_member_idx on public.audit_logs(member_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table if not exists public.notifications (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  member_id text,
  action_url text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_tenant_idx on public.notifications(tenant_id);
create index if not exists notifications_read_idx on public.notifications(read);

create table if not exists public.chat_threads (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  context jsonb,
  created_by text not null default coalesce(auth.uid()::text, 'system'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_threads_tenant_idx on public.chat_threads(tenant_id);
create trigger chat_threads_set_updated_at before update on public.chat_threads
for each row execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  thread_id text not null references public.chat_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  evidence jsonb,
  suggested_actions jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on public.chat_messages(thread_id);
create index if not exists chat_messages_tenant_idx on public.chat_messages(tenant_id);

-- ============================================================================
-- Analytics + outcomes (read-heavy)
-- ============================================================================

create table if not exists public.persona_clusters (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  name text not null,
  description text not null,
  member_ids text[] not null default '{}'::text[],
  characteristics text[] not null default '{}'::text[],
  suggested_uses text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

create index if not exists persona_clusters_tenant_idx on public.persona_clusters(tenant_id);

create table if not exists public.member_wrapped (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  period text not null,
  start_snapshot jsonb not null,
  current_snapshot jsonb not null,
  highlights jsonb not null,
  wins text[] not null default '{}'::text[],
  generated_at timestamptz not null default now()
);

create index if not exists member_wrapped_tenant_idx on public.member_wrapped(tenant_id);
create index if not exists member_wrapped_member_idx on public.member_wrapped(member_id);

create table if not exists public.interaction_logs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  type text not null check (type in ('dm','call','email','event','intro','perk')),
  channel text not null,
  summary text not null,
  draft_id text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists interaction_logs_tenant_idx on public.interaction_logs(tenant_id);
create index if not exists interaction_logs_member_idx on public.interaction_logs(member_id);

create table if not exists public.outcome_feedback (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  interaction_id text not null,
  rating int not null check (rating between 1 and 10),
  feedback text,
  escalated boolean not null default false,
  escalation_reason text,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz not null default now()
);

create index if not exists outcome_feedback_tenant_idx on public.outcome_feedback(tenant_id);
create index if not exists outcome_feedback_member_idx on public.outcome_feedback(member_id);

-- ============================================================================
-- Auth trigger: create profile on signup
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, created_at, updated_at)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'read_only', now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_users enable row level security;
alter table public.members enable row level security;
alter table public.facts enable row level security;
alter table public.external_signals enable row level security;
alter table public.opportunities enable row level security;
alter table public.message_drafts enable row level security;
alter table public.forced_success_items enable row level security;
alter table public.intro_suggestions enable row level security;
alter table public.intro_records enable row level security;
alter table public.perks enable row level security;
alter table public.perk_recommendations enable row level security;
alter table public.perk_partner_applications enable row level security;
alter table public.mastermind_groups enable row level security;
alter table public.monthly_agendas enable row level security;
alter table public.workshop_plans enable row level security;
alter table public.pods enable row level security;
alter table public.surveys enable row level security;
alter table public.resources enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.persona_clusters enable row level security;
alter table public.member_wrapped enable row level security;
alter table public.interaction_logs enable row level security;
alter table public.outcome_feedback enable row level security;

-- Tenants: readable if you have membership
drop policy if exists tenants_read on public.tenants;
create policy tenants_read on public.tenants
for select to authenticated
using (public.has_tenant_access(id));

-- Profiles: self read/update
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Tenant memberships: self read; admin manage
drop policy if exists tenant_users_self_read on public.tenant_users;
create policy tenant_users_self_read on public.tenant_users
for select to authenticated
using (user_id = auth.uid());

drop policy if exists tenant_users_admin_write on public.tenant_users;
create policy tenant_users_admin_write on public.tenant_users
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Helper macro-ish: tenant read/write policies per table
-- Members
drop policy if exists members_tenant_read on public.members;
create policy members_tenant_read on public.members
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists members_tenant_write on public.members;
create policy members_tenant_write on public.members
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Facts
drop policy if exists facts_tenant_read on public.facts;
create policy facts_tenant_read on public.facts
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists facts_tenant_write on public.facts;
create policy facts_tenant_write on public.facts
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- External signals
drop policy if exists external_signals_tenant_read on public.external_signals;
create policy external_signals_tenant_read on public.external_signals
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists external_signals_tenant_write on public.external_signals;
create policy external_signals_tenant_write on public.external_signals
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Opportunities
drop policy if exists opportunities_tenant_read on public.opportunities;
create policy opportunities_tenant_read on public.opportunities
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists opportunities_tenant_write on public.opportunities;
create policy opportunities_tenant_write on public.opportunities
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Drafts
drop policy if exists message_drafts_tenant_read on public.message_drafts;
create policy message_drafts_tenant_read on public.message_drafts
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists message_drafts_tenant_write on public.message_drafts;
create policy message_drafts_tenant_write on public.message_drafts
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Forced success
drop policy if exists forced_success_items_tenant_read on public.forced_success_items;
create policy forced_success_items_tenant_read on public.forced_success_items
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists forced_success_items_tenant_write on public.forced_success_items;
create policy forced_success_items_tenant_write on public.forced_success_items
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Intros
drop policy if exists intro_suggestions_tenant_read on public.intro_suggestions;
create policy intro_suggestions_tenant_read on public.intro_suggestions
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists intro_suggestions_tenant_write on public.intro_suggestions;
create policy intro_suggestions_tenant_write on public.intro_suggestions
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists intro_records_tenant_read on public.intro_records;
create policy intro_records_tenant_read on public.intro_records
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists intro_records_tenant_write on public.intro_records;
create policy intro_records_tenant_write on public.intro_records
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Perks
drop policy if exists perks_tenant_read on public.perks;
create policy perks_tenant_read on public.perks
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists perks_tenant_write on public.perks;
create policy perks_tenant_write on public.perks
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists perk_recommendations_tenant_read on public.perk_recommendations;
create policy perk_recommendations_tenant_read on public.perk_recommendations
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists perk_recommendations_tenant_write on public.perk_recommendations;
create policy perk_recommendations_tenant_write on public.perk_recommendations
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists perk_partner_applications_tenant_read on public.perk_partner_applications;
create policy perk_partner_applications_tenant_read on public.perk_partner_applications
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists perk_partner_applications_tenant_write on public.perk_partner_applications;
create policy perk_partner_applications_tenant_write on public.perk_partner_applications
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Programming
drop policy if exists mastermind_groups_tenant_read on public.mastermind_groups;
create policy mastermind_groups_tenant_read on public.mastermind_groups
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists mastermind_groups_tenant_write on public.mastermind_groups;
create policy mastermind_groups_tenant_write on public.mastermind_groups
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists monthly_agendas_tenant_read on public.monthly_agendas;
create policy monthly_agendas_tenant_read on public.monthly_agendas
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists monthly_agendas_tenant_write on public.monthly_agendas;
create policy monthly_agendas_tenant_write on public.monthly_agendas
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists workshop_plans_tenant_read on public.workshop_plans;
create policy workshop_plans_tenant_read on public.workshop_plans
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists workshop_plans_tenant_write on public.workshop_plans;
create policy workshop_plans_tenant_write on public.workshop_plans
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Pods
drop policy if exists pods_tenant_read on public.pods;
create policy pods_tenant_read on public.pods
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists pods_tenant_write on public.pods;
create policy pods_tenant_write on public.pods
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Surveys
drop policy if exists surveys_tenant_read on public.surveys;
create policy surveys_tenant_read on public.surveys
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists surveys_tenant_write on public.surveys;
create policy surveys_tenant_write on public.surveys
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Resources
drop policy if exists resources_tenant_read on public.resources;
create policy resources_tenant_read on public.resources
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists resources_tenant_write on public.resources;
create policy resources_tenant_write on public.resources
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Audit logs: read by tenant; write by writers
drop policy if exists audit_logs_tenant_read on public.audit_logs;
create policy audit_logs_tenant_read on public.audit_logs
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists audit_logs_tenant_write on public.audit_logs;
create policy audit_logs_tenant_write on public.audit_logs
for insert to authenticated
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Notifications: read by tenant; write by writers
drop policy if exists notifications_tenant_read on public.notifications;
create policy notifications_tenant_read on public.notifications
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists notifications_tenant_write on public.notifications;
create policy notifications_tenant_write on public.notifications
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Chat
drop policy if exists chat_threads_tenant_read on public.chat_threads;
create policy chat_threads_tenant_read on public.chat_threads
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists chat_threads_tenant_write on public.chat_threads;
create policy chat_threads_tenant_write on public.chat_threads
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists chat_messages_tenant_read on public.chat_messages;
create policy chat_messages_tenant_read on public.chat_messages
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists chat_messages_tenant_write on public.chat_messages;
create policy chat_messages_tenant_write on public.chat_messages
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- Analytics + outcomes
drop policy if exists persona_clusters_tenant_read on public.persona_clusters;
create policy persona_clusters_tenant_read on public.persona_clusters
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists persona_clusters_tenant_write on public.persona_clusters;
create policy persona_clusters_tenant_write on public.persona_clusters
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists member_wrapped_tenant_read on public.member_wrapped;
create policy member_wrapped_tenant_read on public.member_wrapped
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists member_wrapped_tenant_write on public.member_wrapped;
create policy member_wrapped_tenant_write on public.member_wrapped
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists interaction_logs_tenant_read on public.interaction_logs;
create policy interaction_logs_tenant_read on public.interaction_logs
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists interaction_logs_tenant_write on public.interaction_logs;
create policy interaction_logs_tenant_write on public.interaction_logs
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists outcome_feedback_tenant_read on public.outcome_feedback;
create policy outcome_feedback_tenant_read on public.outcome_feedback
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists outcome_feedback_tenant_write on public.outcome_feedback;
create policy outcome_feedback_tenant_write on public.outcome_feedback
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

commit;
NOTIFY pgrst, 'reload schema';
