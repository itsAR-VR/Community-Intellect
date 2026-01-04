import type { UserRole } from "@/lib/types"
import { CLUB_TENANT_ID } from "@/lib/club"
import { requireWhoami } from "@/lib/auth/whoami"
import { getTenantSettings } from "@/lib/data/settings"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "./settings-client"

type TenantUserRow = {
  id: string
  email: string
  fullName: string
  role: UserRole
}

export default async function SettingsPage() {
  const whoami = await requireWhoami()
  const isAdmin = whoami.user.role === "admin"
  const canEditSettings = whoami.user.role === "admin" || whoami.user.role === "community_manager"

  const [settings, tenantUsers] = await Promise.all([
    getTenantSettings(CLUB_TENANT_ID),
    (async (): Promise<TenantUserRow[]> => {
      if (!isAdmin) return []

      const rows = await prisma.tenantUser.findMany({
        where: { tenantId: CLUB_TENANT_ID },
        orderBy: { createdAt: "asc" },
        include: { user: true },
      })

      return rows.map((row) => ({
        id: row.user.id,
        email: row.user.email ?? "",
        fullName: row.user.fullName ?? "",
        role: (row.user.role ?? "read_only") as UserRole,
      }))
    })(),
  ])

  return (
    <SettingsClient
      initialSettings={settings.settings}
      tenantUsers={tenantUsers}
      isAdmin={isAdmin}
      canEditSettings={canEditSettings}
    />
  )
}
