import "server-only"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { TenantId, UserRole } from "@/lib/types"
import { CLUB_NAME, CLUB_TENANT_ID } from "@/lib/club"
import { prisma } from "@/lib/prisma"

export type WhoamiClub = { id: TenantId; name: string }

export type Whoami = {
  user: { id: string; email: string; name: string; role: UserRole }
  club: WhoamiClub | null
}

export async function getWhoami(): Promise<Whoami | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  if (!data.user) return null

  const user = data.user

  const profile = await prisma.profile.findUnique({ where: { id: user.id } })
  const membership = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId: CLUB_TENANT_ID, userId: user.id } },
  })

  const role = (profile?.role as UserRole | undefined) ?? "read_only"
  const name = (profile?.fullName as string | undefined) || user.user_metadata?.full_name || user.email || "User"
  const email = (user.email ?? profile?.email ?? "") as string

  return {
    user: { id: user.id, email, name, role },
    club: membership?.tenantId ? { id: CLUB_TENANT_ID, name: CLUB_NAME } : null,
  }
}

export async function requireWhoami(): Promise<Whoami> {
  const whoami = await getWhoami()
  if (!whoami) redirect("/login")
  return whoami
}
