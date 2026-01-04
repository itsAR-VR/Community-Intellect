import "server-only"

import { randomUUID } from "crypto"
import { prisma } from "@/lib/prisma"
import type { TenantId } from "@/lib/types"
import { dateToIsoOrUndefined, nullToUndefined } from "@/lib/data/_utils"

import type { SlackDmThreadRow, SlackIdentityRow } from "@/lib/integrations/slack/types"

export async function getSlackIdentitiesForTenant(tenantId: TenantId): Promise<SlackIdentityRow[]> {
  const data = await prisma.slackIdentity.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" } })
  return data.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    memberId: r.memberId,
    teamId: r.teamId,
    slackUserId: r.slackUserId,
    slackEmail: nullToUndefined(r.slackEmail),
    slackDisplayName: nullToUndefined(r.slackDisplayName),
    createdAt: dateToIsoOrUndefined(r.createdAt),
    updatedAt: dateToIsoOrUndefined(r.updatedAt),
  }))
}

export async function getSlackDmThreadsForTenant(tenantId: TenantId): Promise<SlackDmThreadRow[]> {
  const data = await prisma.slackDmThread.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" } })
  return data.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    memberId: r.memberId,
    teamId: r.teamId,
    slackChannelId: r.slackChannelId,
    lastMessageAt: dateToIsoOrUndefined(r.lastMessageAt),
    lastMemberMessageAt: dateToIsoOrUndefined(r.lastMemberMessageAt),
    lastCmMessageAt: dateToIsoOrUndefined(r.lastCmMessageAt),
    memberRepliedAt: dateToIsoOrUndefined(r.memberRepliedAt),
    conversationClosedAt: dateToIsoOrUndefined(r.conversationClosedAt),
    createdAt: dateToIsoOrUndefined(r.createdAt),
    updatedAt: dateToIsoOrUndefined(r.updatedAt),
  }))
}

export async function getSlackIdentityForMember(tenantId: TenantId, memberId: string): Promise<SlackIdentityRow | null> {
  const data = await prisma.slackIdentity.findFirst({ where: { tenantId, memberId } })
  if (!data) return null
  return {
    id: data.id,
    tenantId: data.tenantId,
    memberId: data.memberId,
    teamId: data.teamId,
    slackUserId: data.slackUserId,
    slackEmail: nullToUndefined(data.slackEmail),
    slackDisplayName: nullToUndefined(data.slackDisplayName),
    createdAt: dateToIsoOrUndefined(data.createdAt),
    updatedAt: dateToIsoOrUndefined(data.updatedAt),
  }
}

export async function getSlackDmThreadForMember(tenantId: TenantId, memberId: string): Promise<SlackDmThreadRow | null> {
  const data = await prisma.slackDmThread.findFirst({ where: { tenantId, memberId } })
  if (!data) return null
  return {
    id: data.id,
    tenantId: data.tenantId,
    memberId: data.memberId,
    teamId: data.teamId,
    slackChannelId: data.slackChannelId,
    lastMessageAt: dateToIsoOrUndefined(data.lastMessageAt),
    lastMemberMessageAt: dateToIsoOrUndefined(data.lastMemberMessageAt),
    lastCmMessageAt: dateToIsoOrUndefined(data.lastCmMessageAt),
    memberRepliedAt: dateToIsoOrUndefined(data.memberRepliedAt),
    conversationClosedAt: dateToIsoOrUndefined(data.conversationClosedAt),
    createdAt: dateToIsoOrUndefined(data.createdAt),
    updatedAt: dateToIsoOrUndefined(data.updatedAt),
  }
}

export async function upsertSlackIdentityForMember(input: {
  tenantId: TenantId
  memberId: string
  teamId: string
  slackUserId: string
  slackEmail?: string
  slackDisplayName?: string
  slackChannelId?: string
}): Promise<{ identityId: string; dmThreadId?: string }> {
  const now = new Date()

  const identity = await prisma.slackIdentity.upsert({
    where: { tenantId_slackUserId: { tenantId: input.tenantId, slackUserId: input.slackUserId } },
    create: {
      id: `sid_${randomUUID().slice(0, 10)}`,
      tenantId: input.tenantId,
      memberId: input.memberId,
      teamId: input.teamId,
      slackUserId: input.slackUserId,
      slackEmail: input.slackEmail ?? null,
      slackDisplayName: input.slackDisplayName ?? null,
      createdAt: now,
      updatedAt: now,
    },
    update: {
      memberId: input.memberId,
      teamId: input.teamId,
      slackEmail: input.slackEmail ?? null,
      slackDisplayName: input.slackDisplayName ?? null,
      updatedAt: now,
    },
    select: { id: true },
  })

  let dmThreadId: string | undefined
  if (input.slackChannelId) {
    const dm = await prisma.slackDmThread.upsert({
      where: { tenantId_slackChannelId: { tenantId: input.tenantId, slackChannelId: input.slackChannelId } },
      create: {
        id: `sdm_${randomUUID().slice(0, 10)}`,
        tenantId: input.tenantId,
        memberId: input.memberId,
        teamId: input.teamId,
        slackChannelId: input.slackChannelId,
        createdAt: now,
        updatedAt: now,
      },
      update: { memberId: input.memberId, teamId: input.teamId, updatedAt: now },
      select: { id: true },
    })
    dmThreadId = dm.id
  }

  return { identityId: identity.id, dmThreadId }
}
