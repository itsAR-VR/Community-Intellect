import "server-only"

import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { TenantId, UserRole } from "@/lib/types"

export type WhoamiTenant = { id: TenantId; name: string }

export type Whoami = {
  user: { id: string; email: string; name: string; role: UserRole }
  tenants: WhoamiTenant[]
  defaultTenantId: TenantId
}

function toTenantId(id: string): TenantId {
  return (id as TenantId) ?? "b2b"
}

export async function getWhoami(): Promise<Whoami | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  if (!data.user) return null

  const user = data.user

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,default_tenant_id")
    .eq("id", user.id)
    .maybeSingle()
  if (profileError) throw profileError

  const { data: memberships, error: membershipsError } = await supabase
    .from("tenant_users")
    .select("tenant_id, tenants:tenants(id,name)")
    .eq("user_id", user.id)
  if (membershipsError) throw membershipsError

  const tenants: WhoamiTenant[] = (memberships ?? [])
    .map((m) => {
      const t = m.tenants as unknown as { id: string; name: string } | null
      if (!t) return null
      return { id: toTenantId(t.id), name: t.name }
    })
    .filter((t): t is WhoamiTenant => !!t)

  const role = (profile?.role as UserRole | undefined) ?? "read_only"
  const name = (profile?.full_name as string | undefined) || user.user_metadata?.full_name || user.email || "User"
  const email = (user.email ?? profile?.email ?? "") as string

  const defaultTenantId = toTenantId(
    (profile?.default_tenant_id as string | null | undefined) ?? tenants[0]?.id ?? "b2b",
  )

  return {
    user: { id: user.id, email, name, role },
    tenants,
    defaultTenantId,
  }
}

export async function requireWhoami(): Promise<Whoami> {
  const whoami = await getWhoami()
  if (!whoami) redirect("/login")
  return whoami
}
