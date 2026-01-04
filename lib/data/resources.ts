import "server-only"

import type { KnowledgeResource, TenantId } from "@/lib/types"
import { dateToIso, nullToUndefined } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function resourceRowToResource(row: any): KnowledgeResource {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    description: row.description,
    type: row.type,
    tags: row.tags ?? [],
    url: nullToUndefined(row.url),
    content: nullToUndefined(row.content),
    attachmentUrl: nullToUndefined(row.attachmentUrl),
    viewCount: row.viewCount,
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  }
}

export async function getResources(tenantId: TenantId): Promise<KnowledgeResource[]> {
  const data = await prisma.resource.findMany({
    where: { tenantId },
    orderBy: { updatedAt: "desc" },
  })
  return data.map(resourceRowToResource)
}

export async function createResource(input: {
  id: string
  tenantId: TenantId
  title: string
  description: string
  type: KnowledgeResource["type"]
  tags: string[]
  url?: string
}): Promise<KnowledgeResource> {
  const now = new Date()
  const data = await prisma.resource.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      title: input.title,
      description: input.description,
      type: input.type,
      tags: input.tags,
      url: input.url ?? null,
      content: null,
      attachmentUrl: null,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  })
  return resourceRowToResource(data)
}

export async function getResourceById(id: string): Promise<KnowledgeResource | null> {
  const data = await prisma.resource.findUnique({ where: { id } })
  return data ? resourceRowToResource(data) : null
}

export async function incrementResourceViews(id: string): Promise<KnowledgeResource | null> {
  const data = await prisma.resource
    .update({
      where: { id },
      data: { viewCount: { increment: 1 }, updatedAt: new Date() },
    })
    .catch(() => null)
  return data ? resourceRowToResource(data) : null
}
