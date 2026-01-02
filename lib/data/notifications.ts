import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { NotificationItem, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function notificationRowToNotification(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    memberId: nullToUndefined(row.member_id),
    actionUrl: nullToUndefined(row.action_url),
    read: row.read,
    createdAt: row.created_at,
  }
}

export async function getNotifications(tenantId: TenantId, unreadOnly?: boolean): Promise<NotificationItem[]> {
  const supabase = await createSupabaseServerClient()
  let q = supabase.from("notifications").select("*").eq("tenant_id", tenantId)
  if (unreadOnly) q = q.eq("read", false)
  const { data, error } = await q.order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []).map(notificationRowToNotification)
}

export async function markNotificationRead(id: string): Promise<NotificationItem | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("notifications").update({ read: true }).eq("id", id).select("*").maybeSingle()
  if (error) throw error
  return data ? notificationRowToNotification(data) : null
}
