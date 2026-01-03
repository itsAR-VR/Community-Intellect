import { NextResponse } from "next/server"
import { z } from "zod"
import type { TenantId } from "@/lib/types"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { requireTenantAccess } from "@/lib/auth/tenant-access"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const parsed = z
    .object({
      tenantId: z.string(),
    })
    .safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  const tenantId = parsed.data.tenantId as TenantId

  try {
    await requireTenantAccess(tenantId)
    const supabase = await createSupabaseServerClient()

    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id,first_name,last_name,email,company_name,company_role")
      .eq("tenant_id", tenantId)
      .order("last_name", { ascending: true })
      .limit(8)
    if (membersError) throw membersError

    const { data: drafts, error: draftsError } = await supabase
      .from("message_drafts")
      .select("id,member_id,action_type,content,status")
      .eq("tenant_id", tenantId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(6)
    if (draftsError) throw draftsError

    const draftMemberIds = Array.from(
      new Set((drafts ?? []).map((d) => d.member_id).filter((id): id is string => typeof id === "string" && id.length > 0)),
    )

    const { data: draftMembers, error: draftMembersError } = await supabase
      .from("members")
      .select("id,first_name,last_name,company_name,company_role,email")
      .eq("tenant_id", tenantId)
      .in("id", draftMemberIds.length > 0 ? draftMemberIds : ["__none__"])
    if (draftMembersError) throw draftMembersError

    const draftMemberById = new Map(
      (draftMembers ?? []).map((m) => [
        m.id,
        {
          id: m.id,
          firstName: m.first_name,
          lastName: m.last_name,
          email: m.email,
          company: { name: m.company_name, role: m.company_role },
        },
      ]),
    )

    return NextResponse.json({
      members: (members ?? []).map((m) => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        email: m.email,
        company: { name: m.company_name, role: m.company_role },
      })),
      drafts: (drafts ?? []).map((d) => ({
        id: d.id,
        memberId: d.member_id,
        actionType: d.action_type,
        content: d.content,
        status: d.status,
        member: draftMemberById.get(d.member_id ?? "") ?? null,
      })),
    })
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
