import type { TenantId, UserRole } from "@/lib/types"
import { requireWhoami } from "@/lib/auth/whoami"
import { getTenantSettings } from "@/lib/data/settings"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

type TenantUserRow = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export default async function SettingsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId

  const whoami = await requireWhoami()
  const isAdmin = whoami.user.role === "admin"

  const [settings, tenantUsers] = await Promise.all([
    getTenantSettings(typedTenantId),
    (async (): Promise<TenantUserRow[]> => {
      if (!isAdmin) return []
      const supabase = await createSupabaseServerClient()
      const { data, error } = await supabase
        .from("tenant_users")
        .select("user_id, profiles:profiles(id,email,full_name,role)")
        .eq("tenant_id", typedTenantId)
        .order("created_at", { ascending: true })
      if (error) throw error

      return (data ?? [])
        .map((row: any) => {
          const p = row.profiles as any
          if (!p) return null
          return {
            id: p.id,
            email: p.email ?? "",
            fullName: p.full_name ?? "",
            role: (p.role ?? "read_only") as UserRole,
          } satisfies TenantUserRow
        })
        .filter((x): x is TenantUserRow => !!x)
    })(),
  ])

  return <SettingsClient tenantId={typedTenantId} initialSettings={settings.settings} tenantUsers={tenantUsers} isAdmin={isAdmin} />
}

