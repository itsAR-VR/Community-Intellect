import { mockResources } from "../mock-data"
import type { KnowledgeResource, TenantId, ResourceType } from "../types"

export async function getResources(
  tenantId: TenantId,
  filters?: {
    type?: ResourceType
    tags?: string[]
    search?: string
  },
): Promise<KnowledgeResource[]> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  let resources = mockResources.filter((r) => r.tenantId === tenantId)

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
  await new Promise((resolve) => setTimeout(resolve, 50))
  return mockResources.find((r) => r.id === id) ?? null
}

export async function incrementResourceViews(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  // In real implementation, this would update the database
}
