import "server-only"

import { requireWhoami } from "@/lib/auth/whoami"

export async function requireClubAccess() {
  const whoami = await requireWhoami()
  if (!whoami.club) throw new Error("FORBIDDEN")
  return whoami
}

// Back-compat alias for older route handlers (remove over time).
export const requireTenantAccess = requireClubAccess
