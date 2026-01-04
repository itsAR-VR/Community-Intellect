import "server-only"

import type { NotificationItem } from "@/lib/types"
import { getNotifications as dbGetNotifications, markNotificationRead as dbMarkNotificationRead } from "@/lib/data"
import { requireClubAccess } from "@/lib/auth/tenant-access"
import { CLUB_TENANT_ID } from "@/lib/club"

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  await requireClubAccess()
  return dbGetNotifications(CLUB_TENANT_ID, unreadOnly)
}

export async function markNotificationRead(id: string): Promise<void> {
  await requireClubAccess()
  await dbMarkNotificationRead(id)
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications(true)
  return notifications.length
}
