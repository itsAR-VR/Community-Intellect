-- Community Intellect - Tenant settings + Velocity (challenges)

begin;

-- ============================================================================
-- Tenant settings
-- ============================================================================

create table if not exists public.tenant_settings (
  tenant_id text primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_tenant_settings_updated_at on public.tenant_settings;
create trigger set_tenant_settings_updated_at
before update on public.tenant_settings
for each row execute procedure public.set_updated_at();

alter table public.tenant_settings enable row level security;

drop policy if exists tenant_settings_read on public.tenant_settings;
create policy tenant_settings_read on public.tenant_settings
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists tenant_settings_write on public.tenant_settings;
create policy tenant_settings_write on public.tenant_settings
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- ============================================================================
-- Velocity: challenges + proofs
-- ============================================================================

create table if not exists public.velocity_challenges (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  title text not null,
  theme text not null,
  participant_ids text[] not null default '{}'::text[],
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists velocity_challenges_tenant_id_idx on public.velocity_challenges(tenant_id);

create table if not exists public.velocity_proofs (
  id text primary key,
  tenant_id text not null references public.tenants(id) on delete cascade,
  challenge_id text not null references public.velocity_challenges(id) on delete cascade,
  member_id text not null references public.members(id) on delete cascade,
  link text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists velocity_proofs_tenant_id_idx on public.velocity_proofs(tenant_id);
create index if not exists velocity_proofs_challenge_id_idx on public.velocity_proofs(challenge_id);

alter table public.velocity_challenges enable row level security;
alter table public.velocity_proofs enable row level security;

drop policy if exists velocity_challenges_read on public.velocity_challenges;
create policy velocity_challenges_read on public.velocity_challenges
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists velocity_challenges_write on public.velocity_challenges;
create policy velocity_challenges_write on public.velocity_challenges
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

drop policy if exists velocity_proofs_read on public.velocity_proofs;
create policy velocity_proofs_read on public.velocity_proofs
for select to authenticated
using (public.has_tenant_access(tenant_id));

drop policy if exists velocity_proofs_write on public.velocity_proofs;
create policy velocity_proofs_write on public.velocity_proofs
for all to authenticated
using (public.has_tenant_access(tenant_id) and public.is_writer())
with check (public.has_tenant_access(tenant_id) and public.is_writer());

-- ============================================================================
-- Admin-only role management RPC
-- ============================================================================

-- Allow admins to view profiles for role management UIs (profiles are otherwise self-readable only).
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
for select to authenticated
using (public.is_admin());

create or replace function public.admin_set_user_role(_user_id uuid, _role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  update public.profiles
  set role = _role, updated_at = now()
  where id = _user_id;
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.user_role) from public;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

commit;
