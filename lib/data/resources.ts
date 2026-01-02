import "server-only"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { KnowledgeResource, TenantId } from "@/lib/types"
import { nullToUndefined } from "@/lib/data/_utils"

function resourceRowToResource(row: any): KnowledgeResource {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    type: row.type,
    tags: row.tags ?? [],
    url: nullToUndefined(row.url),
    content: nullToUndefined(row.content),
    attachmentUrl: nullToUndefined(row.attachment_url),
    viewCount: row.view_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getResources(tenantId: TenantId): Promise<KnowledgeResource[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("resources").select("*").eq("tenant_id", tenantId).order("updated_at", {
    ascending: false,
  })
  if (error) throw error
  return (data ?? []).map(resourceRowToResource)
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
  const supabase = await createSupabaseServerClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("resources")
    .insert({
      id: input.id,
      tenant_id: input.tenantId,
      title: input.title,
      description: input.description,
      type: input.type,
      tags: input.tags,
      url: input.url ?? null,
      view_count: 0,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single()
  if (error) throw error
  return resourceRowToResource(data)
}

export async function getResourceById(id: string): Promise<KnowledgeResource | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data ? resourceRowToResource(data) : null
}

export async function incrementResourceViews(id: string): Promise<KnowledgeResource | null> {
  const supabase = await createSupabaseServerClient()
  const { data: existing, error: existingError } = await supabase
    .from("resources")
    .select("view_count")
    .eq("id", id)
    .maybeSingle()
  if (existingError) throw existingError
  if (!existing) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("resources")
    .update({ view_count: (existing.view_count ?? 0) + 1, updated_at: now })
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error) throw error
  return data ? resourceRowToResource(data) : null
}
