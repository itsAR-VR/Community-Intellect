import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import { PrismaPg } from "@prisma/adapter-pg"
import { Prisma, PrismaClient } from "../lib/generated/prisma/client"

import {
  mockMembers,
  mockFacts,
  mockSignals,
  mockOpportunities,
  mockDrafts,
  mockForcedSuccessItems,
  mockIntroSuggestions,
  mockIntroRecords,
  mockPersonaClusters,
  mockWrapped,
  mockInteractionLogs,
  mockOutcomeFeedback,
  mockPerks,
  mockPerkRecommendations,
  mockPerkPartnerApplications,
  mockMastermindGroups,
  mockMonthlyAgendas,
  mockWorkshopPlans,
  mockPods,
  mockSurveys,
  mockResources,
  mockAuditLogs,
  mockNotifications,
  mockChatThreads,
} from "../lib/mock-data"
import type { TenantId } from "../lib/types"

function loadEnv() {
  // `dotenv/config` only loads `.env` by default, but this repo uses `.env.local`.
  // Load `.env.local` first (higher precedence), then fall back to `.env` if present.
  const cwd = process.cwd()
  const candidates = [".env.local", ".env"]

  for (const filename of candidates) {
    const fullPath = path.join(cwd, filename)
    if (!fs.existsSync(fullPath)) continue
    dotenv.config({ path: fullPath })
  }
}

loadEnv()

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function toDate(iso?: string): Date | null {
  return iso ? new Date(iso) : null
}

function dateOnlyToDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`)
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("Missing env vars: set DIRECT_URL (preferred) or DATABASE_URL for Prisma.")
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

  try {
    const force = process.argv.includes("--force")
    const tenantCount = await prisma.tenant.count().catch((err) => {
      throw new Error(
        [
          "Failed to query the database via Prisma. Is the schema migrated and are DATABASE_URL/DIRECT_URL correct?",
          "",
          "Fix:",
          "1) Ensure `DIRECT_URL` points at your Postgres database (not the Supabase REST URL).",
          "2) Run Prisma migrations: `pnpm db:migrate`",
          "",
          `Raw error: ${err instanceof Error ? err.message : String(err)}`,
        ].join("\n"),
      )
    })

    if (tenantCount > 0 && !force) {
      console.log("Seed skipped: tenants already exist. Re-run with --force to reseed.")
      return
    }

    if (force) {
      await prisma.chatMessage.deleteMany()
      await prisma.chatThread.deleteMany()
      await prisma.notification.deleteMany()
      await prisma.auditLog.deleteMany()
      await prisma.outboundMessage.deleteMany()
      await prisma.slackDmThread.deleteMany()
      await prisma.slackIdentity.deleteMany()
      await prisma.slackEvent.deleteMany()
      await prisma.resource.deleteMany()
      await prisma.survey.deleteMany()
      await prisma.pod.deleteMany()
      await prisma.workshopPlan.deleteMany()
      await prisma.monthlyAgenda.deleteMany()
      await prisma.mastermindGroup.deleteMany()
      await prisma.perkPartnerApplication.deleteMany()
      await prisma.perkRecommendation.deleteMany()
      await prisma.perk.deleteMany()
      await prisma.introRecord.deleteMany()
      await prisma.introSuggestion.deleteMany()
      await prisma.forcedSuccessItem.deleteMany()
      await prisma.messageDraft.deleteMany()
      await prisma.opportunity.deleteMany()
      await prisma.externalSignal.deleteMany()
      await prisma.fact.deleteMany()
      await prisma.outcomeFeedback.deleteMany()
      await prisma.interactionLog.deleteMany()
      await prisma.memberWrapped.deleteMany()
      await prisma.personaCluster.deleteMany()
      await prisma.member.deleteMany()
      await prisma.velocityProof.deleteMany()
      await prisma.velocityChallenge.deleteMany()
      await prisma.tenantSettings.deleteMany()
      await prisma.tenantUser.deleteMany()
      await prisma.tenant.deleteMany()
      await prisma.cronJobRun.deleteMany()
    }

    const tenants: Array<{ id: TenantId; name: string }> = [{ id: "b2b", name: "B2B-CMO-Club" }]
    await prisma.tenant.createMany({ data: tenants, skipDuplicates: true })

    const memberTenantById = new Map<string, TenantId>()
    for (const m of mockMembers) memberTenantById.set(m.id, m.tenantId)

    await prisma.member.createMany({
      data: mockMembers.map((m) => ({
        id: m.id,
        tenantId: m.tenantId,
        firstName: m.firstName,
        lastName: m.lastName,
        email: m.email,
        avatarUrl: m.avatarUrl ?? null,
        linkedinUrl: m.linkedInUrl ?? null,
        companyName: m.company.name,
        companyRole: m.company.role,
        companyWebsite: m.company.website ?? null,
        companyStage: m.company.stage ?? null,
        companyHeadcount: m.company.headcount ?? null,
        companyIndustry: m.company.industry ?? null,
        status: m.status,
        joinedAt: toDate(m.joinedAt) ?? new Date(),
        renewalDate: toDate(m.renewalDate),
        riskTier: m.riskTier,
        riskScore: m.riskScore,
        engagementScore: m.engagementScore,
        lastEngagementAt: toDate(m.lastEngagementAt),
        contactState: m.contactState,
        lastContactedAt: toDate(m.lastContactedAt),
        lastValueDropAt: toDate(m.lastValueDropAt),
        onboarding: m.onboarding as any,
        tags: m.tags,
        notes: m.notes ?? null,
        createdAt: toDate(m.createdAt) ?? new Date(),
        updatedAt: toDate(m.updatedAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

	    await prisma.fact.createMany({
	      data: mockFacts.map((f) => ({
	        id: f.id,
	        tenantId: memberTenantById.get(f.memberId) ?? "b2b",
	        memberId: f.memberId,
	        category: f.category,
	        key: f.key,
	        value: f.value,
	        confidence: f.confidence,
	        provenance: f.provenance,
	        evidence: f.evidence ? (f.evidence as Prisma.InputJsonValue) : undefined,
	        verifiedAt: toDate(f.verifiedAt),
	        verifiedBy: f.verifiedBy ?? null,
	        createdAt: toDate(f.createdAt) ?? new Date(),
	        updatedAt: toDate(f.updatedAt) ?? new Date(),
	      })),
	      skipDuplicates: true,
	    })

	    await prisma.externalSignal.createMany({
	      data: mockSignals.map((s) => ({
	        id: s.id,
	        tenantId: memberTenantById.get(s.memberId) ?? "b2b",
	        memberId: s.memberId,
	        source: s.source,
	        type: s.type,
	        whatHappened: s.whatHappened,
	        impliedNeeds: s.impliedNeeds ?? [],
	        tags: s.tags,
	        urgency: s.urgency,
	        confidence: s.confidence,
	        evidence: (s.evidence ?? {}) as Prisma.InputJsonValue,
	        processedAt: toDate(s.processedAt) ?? new Date(),
	        createdAt: toDate(s.createdAt) ?? new Date(),
	      })),
	      skipDuplicates: true,
	    })

    await prisma.opportunity.createMany({
      data: mockOpportunities.map((o) => ({
        id: o.id,
        tenantId: memberTenantById.get(o.memberId) ?? "b2b",
        memberId: o.memberId,
        summary: o.summary,
        tags: o.tags,
        urgency: o.urgency,
        confidence: o.confidence,
        source: o.source,
        signalId: o.signalId ?? null,
        recommendedActions: o.recommendedActions as any,
        dismissed: o.dismissed,
        dismissedAt: toDate(o.dismissedAt),
        dismissedBy: o.dismissedBy ?? null,
        createdAt: toDate(o.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.messageDraft.createMany({
      data: mockDrafts.map((d) => ({
        id: d.id,
        tenantId: memberTenantById.get(d.memberId) ?? "b2b",
        memberId: d.memberId,
        actionType: d.actionType,
        subject: d.subject ?? null,
        content: d.content,
        impactScore: d.impactScore,
        autosendEligible: d.autosendEligible,
        blockedReasons: d.blockedReasons,
        sendRecommendation: d.sendRecommendation,
        status: d.status,
        mergedWithId: d.mergedWithId ?? null,
        generatedFromOpportunityId: d.generatedFromOpportunityId ?? null,
        generatedFromActionId: d.generatedFromActionId ?? null,
        editedAt: toDate(d.editedAt),
        editedBy: d.editedBy ?? null,
        sentAt: toDate(d.sentAt),
        sentBy: d.sentBy ?? null,
        createdAt: toDate(d.createdAt) ?? new Date(),
        updatedAt: toDate(d.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.forcedSuccessItem.createMany({
      data: mockForcedSuccessItems.map((f) => ({
        id: f.id,
        tenantId: memberTenantById.get(f.memberId) ?? "b2b",
        memberId: f.memberId,
        weekOf: f.weekOf,
        recommendedActionType: f.recommendedActionType,
        recommendedActions: f.recommendedActions as any,
        deliveredActionType: f.deliveredActionType ?? null,
        deliveredAt: toDate(f.deliveredAt),
        deliveredBy: f.deliveredBy ?? null,
        draftId: f.draftId ?? null,
        blocked: f.blocked,
        blockedReason: f.blockedReason ?? null,
        createdAt: toDate(f.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.introSuggestion.createMany({
      data: mockIntroSuggestions.map((s) => ({
        id: s.id,
        tenantId: memberTenantById.get(s.memberAId) ?? memberTenantById.get(s.memberBId) ?? "b2b",
        memberAId: s.memberAId,
        memberBId: s.memberBId,
        rationale: s.rationale,
        impactScore: s.impactScore,
        matchingFactIds: s.matchingFactIds,
        dismissed: s.dismissed,
        createdAt: toDate(s.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

	    await prisma.introRecord.createMany({
	      data: mockIntroRecords.map((r) => ({
	        id: r.id,
	        tenantId: memberTenantById.get(r.memberAId) ?? memberTenantById.get(r.memberBId) ?? "b2b",
	        memberAId: r.memberAId,
	        memberBId: r.memberBId,
	        status: r.status,
	        suggestionId: r.suggestionId ?? null,
	        messageToA: r.messageToA ?? null,
	        messageToB: r.messageToB ?? null,
	        outcomeA: r.outcomeA ? (r.outcomeA as Prisma.InputJsonValue) : undefined,
	        outcomeB: r.outcomeB ? (r.outcomeB as Prisma.InputJsonValue) : undefined,
	        createdBy: r.createdBy,
	        createdAt: toDate(r.createdAt) ?? new Date(),
	        completedAt: toDate(r.completedAt),
	      })),
	      skipDuplicates: true,
	    })

    await prisma.perk.createMany({
      data: mockPerks.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        name: p.name,
        description: p.description,
        category: p.category,
        partnerName: p.partnerName,
        partnerLogo: p.partnerLogo ?? null,
        value: p.value ?? null,
        url: p.url ?? null,
        expiresAt: toDate(p.expiresAt),
        active: p.active,
        createdAt: toDate(p.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.perkRecommendation.createMany({
      data: mockPerkRecommendations.map((r) => ({
        id: r.id,
        tenantId: memberTenantById.get(r.memberId) ?? "b2b",
        memberId: r.memberId,
        perkId: r.perkId,
        rationale: r.rationale,
        impactScore: r.impactScore,
        matchingFactIds: r.matchingFactIds,
        dismissed: r.dismissed,
        deliveredAt: toDate(r.deliveredAt),
        createdAt: toDate(r.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.perkPartnerApplication.createMany({
      data: mockPerkPartnerApplications.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        companyName: a.companyName,
        contactName: a.contactName,
        contactEmail: a.contactEmail,
        perkDescription: a.perkDescription,
        status: a.status,
        reviewedBy: a.reviewedBy ?? null,
        reviewedAt: toDate(a.reviewedAt),
        notes: a.notes ?? null,
        createdAt: toDate(a.createdAt) ?? new Date(),
        updatedAt: toDate(a.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.mastermindGroup.createMany({
      data: mockMastermindGroups.map((g) => ({
        id: g.id,
        tenantId: g.tenantId,
        name: g.name,
        theme: g.theme ?? null,
        memberIds: g.memberIds,
        leaderId: g.leaderId,
        nextSessionAt: toDate(g.nextSessionAt),
        rotationSchedule: g.rotationSchedule,
        agendaDraft: g.agendaDraft ?? null,
        followUpItems: g.followUpItems as any,
        createdAt: toDate(g.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.monthlyAgenda.createMany({
      data: mockMonthlyAgendas.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        month: a.month,
        themes: a.themes,
        template: a.template,
        speakers: a.speakers as any,
        workshops: a.workshops as any,
        createdAt: toDate(a.createdAt) ?? new Date(),
        updatedAt: toDate(a.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.workshopPlan.createMany({
      data: mockWorkshopPlans.map((w) => ({
        id: w.id,
        tenantId: w.tenantId,
        title: w.title,
        topic: w.topic,
        suggestedSpeakers: w.suggestedSpeakers as any,
        targetAudience: w.targetAudience,
        status: w.status,
        scheduledAt: toDate(w.scheduledAt),
        createdAt: toDate(w.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.pod.createMany({
      data: mockPods.map((p) => ({
        id: p.id,
        tenantId: p.tenantId,
        name: p.name,
        memberIds: p.memberIds,
        monthlyGoalsPromptSent: p.monthlyGoalsPromptSent,
        monthlyGoalsReceived: p.monthlyGoalsReceived,
        receiptsShared: p.receiptsShared,
        quietMemberIds: p.quietMemberIds,
        createdAt: toDate(p.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.survey.createMany({
      data: mockSurveys.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        memberId: s.memberId,
        cadence: s.cadence,
        lastSentAt: toDate(s.lastSentAt),
        lastCompletedAt: toDate(s.lastCompletedAt),
        completionRate: s.completionRate,
        responses: s.responses as any,
      })),
      skipDuplicates: true,
    })

    await prisma.resource.createMany({
      data: mockResources.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        title: r.title,
        description: r.description,
        type: r.type,
        tags: r.tags,
        url: r.url ?? null,
        content: r.content ?? null,
        attachmentUrl: r.attachmentUrl ?? null,
        viewCount: r.viewCount,
        createdAt: toDate(r.createdAt) ?? new Date(),
        updatedAt: toDate(r.updatedAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

	    await prisma.auditLog.createMany({
	      data: mockAuditLogs.map((l) => ({
	        id: l.id,
	        tenantId: l.tenantId,
	        type: l.type,
	        actorId: l.actor,
	        actorRole: l.actorRole,
	        actorLabel: l.actor,
	        memberId: l.memberId ?? null,
	        details: (l.details ?? {}) as Prisma.InputJsonValue,
	        createdAt: toDate(l.createdAt) ?? new Date(),
	      })),
	      skipDuplicates: true,
	    })

    await prisma.notification.createMany({
      data: mockNotifications.map((n) => ({
        id: n.id,
        tenantId: "b2b",
        type: n.type,
        title: n.title,
        description: n.description,
        memberId: n.memberId ?? null,
        actionUrl: n.actionUrl ?? null,
        read: n.read,
        createdAt: toDate(n.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

	    await prisma.chatThread.createMany({
	      data: mockChatThreads.map((t) => ({
	        id: t.id,
	        tenantId: t.tenantId,
	        title: t.title,
	        context: t.context ? (t.context as Prisma.InputJsonValue) : undefined,
	        createdBy: "system",
	        createdAt: toDate(t.createdAt) ?? new Date(),
	        updatedAt: toDate(t.updatedAt) ?? new Date(),
	      })),
	      skipDuplicates: true,
	    })

	    await prisma.chatMessage.createMany({
	      data: mockChatThreads.flatMap((t) =>
	        t.messages.map((m) => ({
	          id: m.id,
	          tenantId: t.tenantId,
	          threadId: t.id,
	          role: m.role,
	          content: m.content,
	          evidence: m.evidence ? (m.evidence as Prisma.InputJsonValue) : undefined,
	          suggestedActions: m.suggestedActions
	            ? (m.suggestedActions as unknown as Prisma.InputJsonValue)
	            : undefined,
	          createdAt: toDate(m.createdAt) ?? new Date(),
	        })),
	      ),
	      skipDuplicates: true,
	    })

    await prisma.personaCluster.createMany({
      data: mockPersonaClusters.map((c) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        description: c.description,
        memberIds: c.memberIds,
        characteristics: c.characteristics,
        suggestedUses: c.suggestedUses,
        createdAt: toDate(c.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.memberWrapped.createMany({
      data: mockWrapped.map((w) => ({
        id: `${w.memberId}:${w.period}`,
        tenantId: memberTenantById.get(w.memberId) ?? "b2b",
        memberId: w.memberId,
        period: w.period,
        startSnapshot: w.startSnapshot as any,
        currentSnapshot: w.currentSnapshot as any,
        highlights: w.highlights as any,
        wins: w.wins,
        generatedAt: toDate(w.generatedAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.interactionLog.createMany({
      data: mockInteractionLogs.map((i) => ({
        id: i.id,
        tenantId: memberTenantById.get(i.memberId) ?? "b2b",
        memberId: i.memberId,
        type: i.type,
        channel: i.channel,
        summary: i.summary,
        draftId: i.draftId ?? null,
        createdBy: i.createdBy,
        createdAt: toDate(i.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    await prisma.outcomeFeedback.createMany({
      data: mockOutcomeFeedback.map((o) => ({
        id: o.id,
        tenantId: memberTenantById.get(o.memberId) ?? "b2b",
        memberId: o.memberId,
        interactionId: o.interactionId,
        rating: o.rating,
        feedback: o.feedback ?? null,
        escalated: o.escalated,
        escalationReason: o.escalationReason ?? null,
        resolvedAt: toDate(o.resolvedAt),
        resolvedBy: o.resolvedBy ?? null,
        createdAt: toDate(o.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })

    // Optional: create an admin user for local/dev (Supabase Auth).
    const seedEmail = process.env.SEED_ADMIN_EMAIL
    const seedPassword = process.env.SEED_ADMIN_PASSWORD
    if (seedEmail && seedPassword) {
      const supabaseUrl = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL")
      const serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")

      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })

      const { data: created, error } = await supabase.auth.admin.createUser({
        email: seedEmail,
        password: seedPassword,
        email_confirm: true,
        user_metadata: { full_name: "Dev Admin" },
      })
      if (error && !String(error.message).includes("already registered")) throw error

      const userId = created?.user?.id
      if (userId) {
        await prisma.profile.upsert({
          where: { id: userId },
          create: { id: userId, email: seedEmail, fullName: "Dev Admin", role: "admin", defaultTenantId: "b2b" },
          update: { email: seedEmail, fullName: "Dev Admin", role: "admin", defaultTenantId: "b2b", updatedAt: new Date() },
        })

        await prisma.tenantUser.createMany({
          data: tenants.map((t) => ({ tenantId: t.id, userId })),
          skipDuplicates: true,
        })
      }
    }

    const seededTenants = uniq(mockMembers.map((m) => m.tenantId))
    console.log(`Seed complete. Tenants: ${seededTenants.join(", ")}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
