import "server-only"

import type { NotificationItem, TenantId } from "@/lib/types"
import { dateToIso, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function notificationRowToNotification(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    memberId: nullToUndefined(row.memberId),
    actionUrl: nullToUndefined(row.actionUrl),
    read: row.read,
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getNotifications(tenantId: TenantId, unreadOnly?: boolean): Promise<NotificationItem[]> {
  const data = await prisma.notification.findMany({
    where: { tenantId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
  })
  return data.map(notificationRowToNotification)
}

export async function markNotificationRead(id: string): Promise<NotificationItem | null> {
  const data = await prisma.notification.update({ where: { id }, data: { read: true } }).catch(() => null)
  return data ? notificationRowToNotification(data) : null
}
