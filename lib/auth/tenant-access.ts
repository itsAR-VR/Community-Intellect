import "server-only"

import type { TenantId } from "@/lib/types"
import { requireWhoami } from "@/lib/auth/whoami"

export async function requireTenantAccess(tenantId: TenantId) {
  const whoami = await requireWhoami()
  const allowed = whoami.tenants.some((t) => t.id === tenantId)
  if (!allowed) throw new Error("FORBIDDEN")
  return whoami
}

