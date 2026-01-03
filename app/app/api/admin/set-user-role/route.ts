import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId, UserRole } from "@/lib/types"
import { requireTenantAccess } from "@/lib/auth/tenant-access"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const BodySchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  role: z.enum(["admin", "community_manager", "read_only"]),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 })

  const tenantId = parsed.data.tenantId as TenantId
  const role = parsed.data.role as UserRole

  try {
    const whoami = await requireTenantAccess(tenantId)
    if (whoami.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: parsed.data.userId, _role: role })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}

