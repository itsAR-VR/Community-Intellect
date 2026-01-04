-- Community Intellect - Collapse to single-tenant (B2B-CMO-Club)

begin;

-- Ensure the single club tenant exists and has the right display name.
insert into public.tenants (id, name)
values ('b2b', 'B2B-CMO-Club')
on conflict (id) do update
set name = excluded.name;

-- If an older "founders" tenant exists, preserve user access by copying memberships to b2b.
insert into public.tenant_users (tenant_id, user_id)
select 'b2b' as tenant_id, tu.user_id
from public.tenant_users tu
where tu.tenant_id = 'founders'
on conflict (tenant_id, user_id) do nothing;

-- Ensure no profile points at a removed tenant.
update public.profiles
set default_tenant_id = 'b2b'
where default_tenant_id = 'founders';

-- Remove the old tenant (cascades to tenant-scoped tables).
delete from public.tenants
where id = 'founders';

commit;
