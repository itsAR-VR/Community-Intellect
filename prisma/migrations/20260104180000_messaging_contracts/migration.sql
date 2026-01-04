-- Messaging + Slack ingestion contracts (Phase 1 scaffolding).

create table if not exists public.slack_events (
  id text primary key,
  tenant_id text null references public.tenants (id) on delete cascade,
  team_id text not null,
  event_id text not null,
  event_type text not null,
  event_ts text null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  processing_error text null
);

create unique index if not exists slack_events_event_id_key on public.slack_events (event_id);
create index if not exists slack_events_tenant_id_idx on public.slack_events (tenant_id);
create index if not exists slack_events_received_at_idx on public.slack_events (received_at);

create table if not exists public.slack_identities (
  id text primary key,
  tenant_id text not null references public.tenants (id) on delete cascade,
  member_id text not null references public.members (id) on delete cascade,
  team_id text not null,
  slack_user_id text not null,
  slack_email text null,
  slack_display_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists slack_identities_tenant_slack_user_key on public.slack_identities (tenant_id, slack_user_id);
create unique index if not exists slack_identities_tenant_member_key on public.slack_identities (tenant_id, member_id);
create index if not exists slack_identities_member_id_idx on public.slack_identities (member_id);

create table if not exists public.slack_dm_threads (
  id text primary key,
  tenant_id text not null references public.tenants (id) on delete cascade,
  member_id text not null references public.members (id) on delete cascade,
  team_id text not null,
  slack_channel_id text not null,
  last_message_at timestamptz null,
  last_member_message_at timestamptz null,
  last_cm_message_at timestamptz null,
  member_replied_at timestamptz null,
  conversation_closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists slack_dm_threads_tenant_channel_key on public.slack_dm_threads (tenant_id, slack_channel_id);
create unique index if not exists slack_dm_threads_tenant_member_key on public.slack_dm_threads (tenant_id, member_id);
create index if not exists slack_dm_threads_member_id_idx on public.slack_dm_threads (member_id);

create table if not exists public.outbound_messages (
  id text primary key,
  tenant_id text not null references public.tenants (id) on delete cascade,
  member_id text not null references public.members (id) on delete cascade,
  draft_id text null references public.message_drafts (id) on delete set null,
  message_type text not null,
  channel text not null,
  send_as text not null,
  status text not null default 'queued',
  body text not null,
  queued_at timestamptz not null default now(),
  scheduled_for timestamptz null,
  sent_at timestamptz null,
  external_id text null,
  thread_channel_id text null,
  thread_ts text null,
  error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outbound_messages_tenant_id_idx on public.outbound_messages (tenant_id);
create index if not exists outbound_messages_member_id_idx on public.outbound_messages (member_id);
create index if not exists outbound_messages_status_idx on public.outbound_messages (status);
create index if not exists outbound_messages_queued_at_idx on public.outbound_messages (queued_at);

