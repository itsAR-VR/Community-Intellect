import "server-only"

import type { KnowledgeResource, ResourceType, TenantId } from "@/lib/types"
import {
  getResourceById as dbGetResourceById,
  getResources as dbGetResources,
  incrementResourceViews as dbIncrementResourceViews,
} from "@/lib/data"

export async function getResources(
  tenantId: TenantId,
  filters?: {
    type?: ResourceType
    tags?: string[]
    search?: string
  },
): Promise<KnowledgeResource[]> {
  let resources = await dbGetResources(tenantId)

  if (filters?.type) {
    resources = resources.filter((r) => r.type === filters.type)
  }
  if (filters?.tags?.length) {
    resources = resources.filter((r) => filters.tags!.some((tag) => r.tags.includes(tag)))
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    resources = resources.filter(
      (r) => r.title.toLowerCase().includes(search) || r.description.toLowerCase().includes(search),
    )
  }

  return resources
}

export async function getResourceById(id: string): Promise<KnowledgeResource | null> {
  return dbGetResourceById(id)
}

export async function incrementResourceViews(id: string): Promise<void> {
  await dbIncrementResourceViews(id)
}
