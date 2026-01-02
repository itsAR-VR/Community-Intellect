import "server-only"

import type { NotificationItem } from "@/lib/types"
import { getNotifications as dbGetNotifications, markNotificationRead as dbMarkNotificationRead } from "@/lib/data"
import { requireWhoami } from "@/lib/auth/whoami"

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  const whoami = await requireWhoami()
  const results = await Promise.all(whoami.tenants.map((t) => dbGetNotifications(t.id, unreadOnly)))
  return results
    .flat()
    .filter((n) => (unreadOnly ? !n.read : true))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function markNotificationRead(id: string): Promise<void> {
  await dbMarkNotificationRead(id)
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications(true)
  return notifications.length
}
