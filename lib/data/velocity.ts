import "server-only"

import type { TenantId, VelocityChallenge, VelocityProof } from "@/lib/types"
import { dateToIso, dateToYmd } from "@/lib/data/_utils"
import { prisma } from "@/lib/prisma"

function challengeRowToChallenge(row: any): VelocityChallenge {
  return {
    id: row.id,
    tenantId: row.tenantId,
    title: row.title,
    theme: row.theme,
    participantIds: row.participantIds ?? [],
    startDate: dateToYmd(row.startDate),
    endDate: dateToYmd(row.endDate),
    active: row.active,
    createdAt: dateToIso(row.createdAt),
  }
}

function proofRowToProof(row: any): VelocityProof {
  return {
    id: row.id,
    tenantId: row.tenantId,
    challengeId: row.challengeId,
    memberId: row.memberId,
    link: row.link,
    description: row.description,
    createdAt: dateToIso(row.createdAt),
  }
}

export async function getVelocityChallenges(tenantId: TenantId): Promise<VelocityChallenge[]> {
  const data = await prisma.velocityChallenge.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(challengeRowToChallenge)
}

export async function getVelocityProofs(tenantId: TenantId): Promise<VelocityProof[]> {
  const data = await prisma.velocityProof.findMany({ where: { tenantId }, orderBy: { createdAt: "desc" } })
  return data.map(proofRowToProof)
}

export async function createVelocityChallenge(input: {
  id: string
  tenantId: TenantId
  title: string
  theme: string
  participantIds: string[]
  startDate: string
  endDate: string
  active: boolean
}): Promise<VelocityChallenge> {
  const data = await prisma.velocityChallenge.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      title: input.title,
      theme: input.theme,
      participantIds: input.participantIds,
      startDate: new Date(`${input.startDate}T00:00:00Z`),
      endDate: new Date(`${input.endDate}T00:00:00Z`),
      active: input.active,
    },
  })
  return challengeRowToChallenge(data)
}

export async function createVelocityProof(input: {
  id: string
  tenantId: TenantId
  challengeId: string
  memberId: string
  link: string
  description: string
}): Promise<VelocityProof> {
  const data = await prisma.velocityProof.create({
    data: {
      id: input.id,
      tenantId: input.tenantId,
      challengeId: input.challengeId,
      memberId: input.memberId,
      link: input.link,
      description: input.description,
    },
  })
  return proofRowToProof(data)
}
