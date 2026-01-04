-- Enable/disable automation settings per tenant.
-- Safe to run multiple times.

begin;

-- Ensure every tenant has a tenant_settings row
insert into public.tenant_settings (tenant_id, settings)
select t.id, '{}'::jsonb
from public.tenants t
on conflict (tenant_id) do nothing;

-- ----------------------------------------------------------------------------
-- Enable automation for b2b
-- ----------------------------------------------------------------------------
update public.tenant_settings ts
set settings = jsonb_set(
  coalesce(ts.settings, '{}'::jsonb),
  '{automation}',
  coalesce(ts.settings->'automation', '{}'::jsonb) ||
    jsonb_build_object(
      'surveys',
      jsonb_build_object(
        'enabled', true,
        'cadence', 'weekly',
        'maxPerRun', 50
      ),
      'programmingReminders',
      jsonb_build_object(
        'enabled', true
      )
    ),
  true
)
where ts.tenant_id = 'b2b';

-- ----------------------------------------------------------------------------
commit;

-- Verify
select
  tenant_id,
  settings->'automation' as automation
from public.tenant_settings
where tenant_id = 'b2b'
order by tenant_id;
