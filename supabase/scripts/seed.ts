import dotenv from "dotenv"
import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

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
} from "../../lib/mock-data"
import type { TenantId } from "../../lib/types"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function nowIso() {
  return new Date().toISOString()
}

function toDbTimestamp(iso?: string) {
  return iso ? new Date(iso).toISOString() : null
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}

function isMissingTableError(err: unknown, table: string) {
  if (!err || typeof err !== "object") return false
  const anyErr = err as any
  return anyErr.code === "PGRST205" && typeof anyErr.message === "string" && anyErr.message.includes(`'public.${table}'`)
}

async function deleteAll(supabase: any, table: string, whereColumn: string) {
  const { error } = await supabase.from(table).delete().neq(whereColumn, "__never__")
  if (error) throw error
}

async function main() {
  const supabaseUrl = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { count: tenantCount, error: tenantCountError } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
  if (tenantCountError) {
    if (isMissingTableError(tenantCountError, "tenants")) {
      throw new Error(
        [
          "Supabase table `public.tenants` was not found via the API.",
          "This usually means the schema migration was not applied (or you're pointing at the wrong Supabase project).",
          "",
          "Fix:",
          "1) In Supabase Dashboard → SQL Editor, run: `supabase/migrations/0001_init.sql`",
          "2) If you just created tables, refresh PostgREST schema cache by running:",
          "   NOTIFY pgrst, 'reload schema';",
          "3) Re-run: `pnpm db:seed`",
        ].join("\n"),
      )
    }
    throw tenantCountError
  }

  const force = process.argv.includes("--force")
  if ((tenantCount ?? 0) > 0 && !force) {
    // DB isn't empty; don't clobber by default.
    console.log("Seed skipped: tenants already exist. Re-run with --force to reseed.")
    return
  }

  if (force) {
    // Best-effort wipe in dependency order (no DB-side exec required).
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "chat_messages", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "chat_threads", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "notifications", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "audit_logs", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "resources", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "surveys", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "pods", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "workshop_plans", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "monthly_agendas", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "mastermind_groups", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "perk_partner_applications", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "perk_recommendations", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "perks", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "intro_records", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "intro_suggestions", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "forced_success_items", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "message_drafts", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "opportunities", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "external_signals", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "facts", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "outcome_feedback", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "interaction_logs", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "member_wrapped", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "persona_clusters", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "members", "id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "tenant_users", "tenant_id")
    // eslint-disable-next-line no-await-in-loop
    await deleteAll(supabase, "tenants", "id")
  }

  const tenants: Array<{ id: TenantId; name: string }> = [
    { id: "b2b", name: "B2B-CMO-Club" },
  ]

  const { error: tenantsError } = await supabase.from("tenants").upsert(tenants)
  if (tenantsError) throw tenantsError

  const memberTenantById = new Map<string, TenantId>()
  for (const m of mockMembers) memberTenantById.set(m.id, m.tenantId)

  const dbMembers = mockMembers.map((m) => ({
    id: m.id,
    tenant_id: m.tenantId,
    first_name: m.firstName,
    last_name: m.lastName,
    email: m.email,
    avatar_url: m.avatarUrl ?? null,
    linkedin_url: m.linkedInUrl ?? null,
    company_name: m.company.name,
    company_role: m.company.role,
    company_website: m.company.website ?? null,
    company_stage: m.company.stage ?? null,
    company_headcount: m.company.headcount ?? null,
    company_industry: m.company.industry ?? null,
    status: m.status,
    joined_at: toDbTimestamp(m.joinedAt) ?? nowIso(),
    renewal_date: toDbTimestamp(m.renewalDate),
    risk_tier: m.riskTier,
    risk_score: m.riskScore,
    engagement_score: m.engagementScore,
    last_engagement_at: toDbTimestamp(m.lastEngagementAt),
    contact_state: m.contactState,
    last_contacted_at: toDbTimestamp(m.lastContactedAt),
    last_value_drop_at: toDbTimestamp(m.lastValueDropAt),
    onboarding: m.onboarding,
    tags: m.tags,
    notes: m.notes ?? null,
    created_at: toDbTimestamp(m.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(m.updatedAt) ?? nowIso(),
  }))

  const { error: membersError } = await supabase.from("members").upsert(dbMembers)
  if (membersError) throw membersError

  const dbFacts = mockFacts.map((f) => ({
    id: f.id,
    tenant_id: memberTenantById.get(f.memberId) ?? "b2b",
    member_id: f.memberId,
    category: f.category,
    key: f.key,
    value: f.value,
    confidence: f.confidence,
    provenance: f.provenance,
    evidence: f.evidence ?? null,
    verified_at: toDbTimestamp(f.verifiedAt),
    verified_by: f.verifiedBy ?? null,
    created_at: toDbTimestamp(f.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(f.updatedAt) ?? nowIso(),
  }))

  const { error: factsError } = await supabase.from("facts").upsert(dbFacts)
  if (factsError) throw factsError

  const dbSignals = mockSignals.map((s) => ({
    id: s.id,
    tenant_id: memberTenantById.get(s.memberId) ?? "b2b",
    member_id: s.memberId,
    source: s.source,
    type: s.type,
    what_happened: s.whatHappened,
    implied_needs: s.impliedNeeds ?? [],
    tags: s.tags,
    urgency: s.urgency,
    confidence: s.confidence,
    evidence: s.evidence ?? {},
    processed_at: toDbTimestamp(s.processedAt) ?? nowIso(),
    created_at: toDbTimestamp(s.createdAt) ?? nowIso(),
  }))

  const { error: signalsError } = await supabase.from("external_signals").upsert(dbSignals)
  if (signalsError) throw signalsError

  const dbOpportunities = mockOpportunities.map((o) => ({
    id: o.id,
    tenant_id: memberTenantById.get(o.memberId) ?? "b2b",
    member_id: o.memberId,
    summary: o.summary,
    tags: o.tags,
    urgency: o.urgency,
    confidence: o.confidence,
    source: o.source,
    signal_id: o.signalId ?? null,
    recommended_actions: o.recommendedActions,
    dismissed: o.dismissed,
    dismissed_at: toDbTimestamp(o.dismissedAt),
    dismissed_by: o.dismissedBy ?? null,
    created_at: toDbTimestamp(o.createdAt) ?? nowIso(),
  }))

  const { error: oppError } = await supabase.from("opportunities").upsert(dbOpportunities)
  if (oppError) throw oppError

  const dbDrafts = mockDrafts.map((d) => ({
    id: d.id,
    tenant_id: memberTenantById.get(d.memberId) ?? "b2b",
    member_id: d.memberId,
    action_type: d.actionType,
    subject: d.subject ?? null,
    content: d.content,
    impact_score: d.impactScore,
    autosend_eligible: d.autosendEligible,
    blocked_reasons: d.blockedReasons,
    send_recommendation: d.sendRecommendation,
    status: d.status,
    merged_with_id: d.mergedWithId ?? null,
    generated_from_opportunity_id: d.generatedFromOpportunityId ?? null,
    generated_from_action_id: d.generatedFromActionId ?? null,
    edited_at: toDbTimestamp(d.editedAt),
    edited_by: d.editedBy ?? null,
    sent_at: toDbTimestamp(d.sentAt),
    sent_by: d.sentBy ?? null,
    created_at: toDbTimestamp(d.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(d.createdAt) ?? nowIso(),
  }))

  const { error: draftsError } = await supabase.from("message_drafts").upsert(dbDrafts)
  if (draftsError) throw draftsError

  const dbForced = mockForcedSuccessItems.map((f) => ({
    id: f.id,
    tenant_id: memberTenantById.get(f.memberId) ?? "b2b",
    member_id: f.memberId,
    week_of: f.weekOf,
    recommended_action_type: f.recommendedActionType,
    recommended_actions: f.recommendedActions,
    delivered_action_type: f.deliveredActionType ?? null,
    delivered_at: toDbTimestamp(f.deliveredAt),
    delivered_by: f.deliveredBy ?? null,
    draft_id: f.draftId ?? null,
    blocked: f.blocked,
    blocked_reason: f.blockedReason ?? null,
    created_at: toDbTimestamp(f.createdAt) ?? nowIso(),
  }))

  const { error: forcedError } = await supabase.from("forced_success_items").upsert(dbForced)
  if (forcedError) throw forcedError

  const dbIntroSuggestions = mockIntroSuggestions.map((s) => ({
    id: s.id,
    tenant_id: memberTenantById.get(s.memberAId) ?? memberTenantById.get(s.memberBId) ?? "b2b",
    member_a_id: s.memberAId,
    member_b_id: s.memberBId,
    rationale: s.rationale,
    impact_score: s.impactScore,
    matching_fact_ids: s.matchingFactIds,
    dismissed: s.dismissed,
    created_at: toDbTimestamp(s.createdAt) ?? nowIso(),
  }))

  const { error: introSugError } = await supabase.from("intro_suggestions").upsert(dbIntroSuggestions)
  if (introSugError) throw introSugError

  const dbIntroRecords = mockIntroRecords.map((r) => ({
    id: r.id,
    tenant_id: memberTenantById.get(r.memberAId) ?? memberTenantById.get(r.memberBId) ?? "b2b",
    member_a_id: r.memberAId,
    member_b_id: r.memberBId,
    status: r.status,
    suggestion_id: r.suggestionId ?? null,
    message_to_a: r.messageToA ?? null,
    message_to_b: r.messageToB ?? null,
    outcome_a: r.outcomeA ?? null,
    outcome_b: r.outcomeB ?? null,
    created_by: r.createdBy,
    created_at: toDbTimestamp(r.createdAt) ?? nowIso(),
    completed_at: toDbTimestamp(r.completedAt),
  }))

  const { error: introRecError } = await supabase.from("intro_records").upsert(dbIntroRecords)
  if (introRecError) throw introRecError

  const dbPerks = mockPerks.map((p) => ({
    id: p.id,
    tenant_id: p.tenantId,
    name: p.name,
    description: p.description,
    category: p.category,
    partner_name: p.partnerName,
    partner_logo: p.partnerLogo ?? null,
    value: p.value ?? null,
    url: p.url ?? null,
    expires_at: toDbTimestamp(p.expiresAt),
    active: p.active,
    created_at: toDbTimestamp(p.createdAt) ?? nowIso(),
  }))

  const { error: perksError } = await supabase.from("perks").upsert(dbPerks)
  if (perksError) throw perksError

  const dbPerkRecs = mockPerkRecommendations.map((r) => ({
    id: r.id,
    tenant_id: memberTenantById.get(r.memberId) ?? "b2b",
    member_id: r.memberId,
    perk_id: r.perkId,
    rationale: r.rationale,
    impact_score: r.impactScore,
    matching_fact_ids: r.matchingFactIds,
    dismissed: r.dismissed,
    delivered_at: toDbTimestamp(r.deliveredAt),
    created_at: toDbTimestamp(r.createdAt) ?? nowIso(),
  }))

  const { error: perkRecError } = await supabase.from("perk_recommendations").upsert(dbPerkRecs)
  if (perkRecError) throw perkRecError

  const dbApps = mockPerkPartnerApplications.map((a) => ({
    id: a.id,
    tenant_id: a.tenantId,
    company_name: a.companyName,
    contact_name: a.contactName,
    contact_email: a.contactEmail,
    perk_description: a.perkDescription,
    status: a.status,
    reviewed_by: a.reviewedBy ?? null,
    reviewed_at: toDbTimestamp(a.reviewedAt),
    notes: a.notes ?? null,
    created_at: toDbTimestamp(a.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(a.createdAt) ?? nowIso(),
  }))

  const { error: appsError } = await supabase.from("perk_partner_applications").upsert(dbApps)
  if (appsError) throw appsError

  const dbGroups = mockMastermindGroups.map((g) => ({
    id: g.id,
    tenant_id: g.tenantId,
    name: g.name,
    theme: g.theme ?? null,
    member_ids: g.memberIds,
    leader_id: g.leaderId,
    next_session_at: toDbTimestamp(g.nextSessionAt),
    rotation_schedule: g.rotationSchedule,
    agenda_draft: g.agendaDraft ?? null,
    follow_up_items: g.followUpItems,
    created_at: toDbTimestamp(g.createdAt) ?? nowIso(),
  }))

  const { error: groupsError } = await supabase.from("mastermind_groups").upsert(dbGroups)
  if (groupsError) throw groupsError

  const dbAgendas = mockMonthlyAgendas.map((a) => ({
    id: a.id,
    tenant_id: a.tenantId,
    month: a.month,
    themes: a.themes,
    template: a.template,
    speakers: a.speakers,
    workshops: a.workshops,
    created_at: toDbTimestamp(a.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(a.updatedAt) ?? nowIso(),
  }))

  const { error: agendasError } = await supabase.from("monthly_agendas").upsert(dbAgendas)
  if (agendasError) throw agendasError

  const dbWorkshops = mockWorkshopPlans.map((w) => ({
    id: w.id,
    tenant_id: w.tenantId,
    title: w.title,
    topic: w.topic,
    suggested_speakers: w.suggestedSpeakers,
    target_audience: w.targetAudience,
    status: w.status,
    scheduled_at: toDbTimestamp(w.scheduledAt),
    created_at: toDbTimestamp(w.createdAt) ?? nowIso(),
  }))

  const { error: workshopsError } = await supabase.from("workshop_plans").upsert(dbWorkshops)
  if (workshopsError) throw workshopsError

  const dbPods = mockPods.map((p) => ({
    id: p.id,
    tenant_id: p.tenantId,
    name: p.name,
    member_ids: p.memberIds,
    monthly_goals_prompt_sent: p.monthlyGoalsPromptSent,
    monthly_goals_received: p.monthlyGoalsReceived,
    receipts_shared: p.receiptsShared,
    quiet_member_ids: p.quietMemberIds,
    created_at: toDbTimestamp(p.createdAt) ?? nowIso(),
  }))

  const { error: podsError } = await supabase.from("pods").upsert(dbPods)
  if (podsError) throw podsError

  const dbSurveys = mockSurveys.map((s) => ({
    id: s.id,
    tenant_id: s.tenantId,
    member_id: s.memberId,
    cadence: s.cadence,
    last_sent_at: toDbTimestamp(s.lastSentAt),
    last_completed_at: toDbTimestamp(s.lastCompletedAt),
    completion_rate: s.completionRate,
    responses: s.responses,
  }))

  const { error: surveysError } = await supabase.from("surveys").upsert(dbSurveys)
  if (surveysError) throw surveysError

  const dbResources = mockResources.map((r) => ({
    id: r.id,
    tenant_id: r.tenantId,
    title: r.title,
    description: r.description,
    type: r.type,
    tags: r.tags,
    url: r.url ?? null,
    content: r.content ?? null,
    attachment_url: r.attachmentUrl ?? null,
    view_count: r.viewCount,
    created_at: toDbTimestamp(r.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(r.updatedAt) ?? nowIso(),
  }))

  const { error: resourcesError } = await supabase.from("resources").upsert(dbResources)
  if (resourcesError) throw resourcesError

  const dbAudit = mockAuditLogs.map((l) => ({
    id: l.id,
    tenant_id: l.tenantId,
    type: l.type,
    actor_id: l.actor,
    actor_role: l.actorRole,
    actor_label: l.actor,
    member_id: l.memberId ?? null,
    details: l.details,
    created_at: toDbTimestamp(l.createdAt) ?? nowIso(),
  }))
  const { error: auditError } = await supabase.from("audit_logs").upsert(dbAudit)
  if (auditError) throw auditError

  const dbNotifs = mockNotifications.map((n) => ({
    id: n.id,
    tenant_id: "b2b",
    type: n.type,
    title: n.title,
    description: n.description,
    member_id: n.memberId ?? null,
    action_url: n.actionUrl ?? null,
    read: n.read,
    created_at: toDbTimestamp(n.createdAt) ?? nowIso(),
  }))
  const { error: notifError } = await supabase.from("notifications").upsert(dbNotifs)
  if (notifError) throw notifError

  const dbThreads = mockChatThreads.map((t) => ({
    id: t.id,
    tenant_id: t.tenantId,
    title: t.title,
    context: t.context ?? null,
    created_at: toDbTimestamp(t.createdAt) ?? nowIso(),
    updated_at: toDbTimestamp(t.updatedAt) ?? nowIso(),
  }))
  const { error: threadsError } = await supabase.from("chat_threads").upsert(dbThreads)
  if (threadsError) throw threadsError

  const dbMessages = mockChatThreads.flatMap((t) =>
    t.messages.map((m) => ({
      id: m.id,
      tenant_id: t.tenantId,
      thread_id: t.id,
      role: m.role,
      content: m.content,
      evidence: m.evidence ?? null,
      suggested_actions: m.suggestedActions ?? null,
      created_at: toDbTimestamp(m.createdAt) ?? nowIso(),
    })),
  )
  const { error: messagesError } = await supabase.from("chat_messages").upsert(dbMessages)
  if (messagesError) throw messagesError

  const dbClusters = mockPersonaClusters.map((c) => ({
    id: c.id,
    tenant_id: c.tenantId,
    name: c.name,
    description: c.description,
    member_ids: c.memberIds,
    characteristics: c.characteristics,
    suggested_uses: c.suggestedUses,
    created_at: toDbTimestamp(c.createdAt) ?? nowIso(),
  }))
  const { error: clustersError } = await supabase.from("persona_clusters").upsert(dbClusters)
  if (clustersError) throw clustersError

  const dbWrapped = mockWrapped.map((w) => ({
    id: `${w.memberId}:${w.period}`,
    tenant_id: memberTenantById.get(w.memberId) ?? "b2b",
    member_id: w.memberId,
    period: w.period,
    start_snapshot: w.startSnapshot,
    current_snapshot: w.currentSnapshot,
    highlights: w.highlights,
    wins: w.wins,
    generated_at: toDbTimestamp(w.generatedAt) ?? nowIso(),
  }))
  const { error: wrappedError } = await supabase.from("member_wrapped").upsert(dbWrapped)
  if (wrappedError) throw wrappedError

  const dbInteractions = mockInteractionLogs.map((i) => ({
    id: i.id,
    tenant_id: memberTenantById.get(i.memberId) ?? "b2b",
    member_id: i.memberId,
    type: i.type,
    channel: i.channel,
    summary: i.summary,
    draft_id: i.draftId ?? null,
    created_by: i.createdBy,
    created_at: toDbTimestamp(i.createdAt) ?? nowIso(),
  }))
  const { error: interactionsError } = await supabase.from("interaction_logs").upsert(dbInteractions)
  if (interactionsError) throw interactionsError

  const dbOutcomes = mockOutcomeFeedback.map((o) => ({
    id: o.id,
    tenant_id: memberTenantById.get(o.memberId) ?? "b2b",
    member_id: o.memberId,
    interaction_id: o.interactionId,
    rating: o.rating,
    feedback: o.feedback ?? null,
    escalated: o.escalated,
    escalation_reason: o.escalationReason ?? null,
    resolved_at: toDbTimestamp(o.resolvedAt),
    resolved_by: o.resolvedBy ?? null,
    created_at: toDbTimestamp(o.createdAt) ?? nowIso(),
  }))
  const { error: outcomesError } = await supabase.from("outcome_feedback").upsert(dbOutcomes)
  if (outcomesError) throw outcomesError

  // Optional: create an admin user for local/dev.
  const seedEmail = process.env.SEED_ADMIN_EMAIL
  const seedPassword = process.env.SEED_ADMIN_PASSWORD
  if (seedEmail && seedPassword) {
    const { data: created, error } = await supabase.auth.admin.createUser({
      email: seedEmail,
      password: seedPassword,
      email_confirm: true,
      user_metadata: { full_name: "Dev Admin" },
    })
    if (error && !String(error.message).includes("already registered")) throw error

    const userId = created?.user?.id
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        email: seedEmail,
        full_name: "Dev Admin",
        role: "admin",
        default_tenant_id: "b2b",
        updated_at: nowIso(),
      })

      await supabase.from("tenant_users").upsert(
        tenants.map((t) => ({ tenant_id: t.id, user_id: userId })),
      )
    }
  }

  const seededTenants = uniq(dbMembers.map((m) => m.tenant_id))
  console.log(`Seed complete. Tenants: ${seededTenants.join(", ")}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
