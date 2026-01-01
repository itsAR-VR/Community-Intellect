import { mockNotifications } from "../mock-data"
import type { NotificationItem } from "../types"

export async function getNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  if (unreadOnly) {
    return mockNotifications.filter((n) => !n.read)
  }
  return mockNotifications
}

export async function markNotificationRead(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  // In real implementation, this would update the database
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications(true)
  return notifications.length
}
