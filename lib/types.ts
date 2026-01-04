// ============================================================================
// CORE DOMAIN TYPES - B2B CMO Club AI
// ============================================================================

// Single-club deployment: keep the DB tenant_id, but the app no longer supports switching.
export type TenantId = "b2b"

export type MemberStatus = "lead" | "accepted" | "active" | "churned" | "paused"
export type RiskTier = "green" | "yellow" | "red"
export type ContactState = "open" | "closed" | "muted"
export type UserRole = "admin" | "community_manager" | "read_only"

// ============================================================================
// MEMBER & PROFILE
// ============================================================================

export interface Member {
  id: string
  tenantId: TenantId
  firstName: string
  lastName: string
  email: string
  avatarUrl?: string
  linkedInUrl?: string

  // Company
  company: {
    name: string
    role: string
    website?: string
    stage?: string
    headcount?: string
    industry?: string
  }

  // Status
  status: MemberStatus
  joinedAt: string
  renewalDate?: string

  // Risk & Engagement
  riskTier: RiskTier
  riskScore: number // 0-100
  engagementScore: number // 0-100
  lastEngagementAt?: string

  // Contact State
  contactState: ContactState
  lastContactedAt?: string
  lastValueDropAt?: string

  // Onboarding
  onboarding: {
    intakeCompleted: boolean
    intakeCompletedAt?: string
    welcomeCallCompleted: boolean
    welcomeCallAt?: string
    introPackDelivered: boolean
    profileVerified: boolean
  }

  // Metadata
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// TRUTH PROFILE (FACTS)
// ============================================================================

export type FactCategory =
  | "goal"
  | "bottleneck"
  | "stack"
  | "hiring"
  | "constraint"
  | "preference"
  | "background"
  | "interest"

export type FactProvenance = "intake" | "survey" | "slack" | "call" | "linkedin" | "external" | "manual"

export interface Fact {
  id: string
  memberId: string
  category: FactCategory
  key: string
  value: string
  confidence: number // 0-100
  provenance: FactProvenance
  evidence?: {
    source: string
    url?: string
    snippet?: string
    capturedAt: string
  }
  verifiedAt?: string
  verifiedBy?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// EXTERNAL SIGNALS
// ============================================================================

export type SignalSource =
  | "slack"
  | "linkedin"
  | "careers"
  | "indeed"
  | "instagram"
  | "x"
  | "call"
  | "survey"
  | "intake"
  | "manual"

export type SignalType =
  | "hiring"
  | "funding"
  | "expansion"
  | "contraction"
  | "milestone"
  | "pain_point"
  | "engagement"
  | "sentiment"
  | "mention"
  | "request"

export interface ExternalSignal {
  id: string
  memberId: string
  source: SignalSource
  type: SignalType
  whatHappened: string
  impliedNeeds?: string[]
  tags: string[]
  urgency: number // 1-10
  confidence: number // 0-100
  evidence: {
    url?: string
    snippet?: string
    rawPayload?: Record<string, unknown>
  }
  processedAt: string
  createdAt: string
}

// ============================================================================
// OPPORTUNITIES & ACTIONS
// ============================================================================

export type ActionType =
  | "intro"
  | "perk"
  | "resource"
  | "workshop_invite"
  | "check_in"
  | "mastermind_invite"
  | "follow_up"
  | "escalation"

export interface ActionRecommendation {
  id: string
  type: ActionType
  title: string
  rationale: string
  impactScore: number // 0-100
  evidence: {
    factIds?: string[]
    signalIds?: string[]
    description: string
  }
  suggestedContent?: string
  relatedMemberId?: string // For intros
  relatedPerkId?: string
  relatedResourceId?: string
  createdAt: string
}

export interface OpportunityItem {
  id: string
  memberId: string
  summary: string
  tags: string[]
  urgency: number // 1-10
  confidence: number // 0-100
  source: SignalSource
  signalId?: string
  recommendedActions: ActionRecommendation[]
  dismissed: boolean
  dismissedAt?: string
  dismissedBy?: string
  createdAt: string
}

// ============================================================================
// MESSAGE DRAFTS
// ============================================================================

export type DraftStatus = "pending" | "approved" | "sent" | "merged" | "discarded"

export interface MessageDraft {
  id: string
  memberId: string
  actionType: ActionType
  subject?: string
  content: string
  impactScore: number

  // Autosend eligibility
  autosendEligible: boolean
  blockedReasons: string[]
  sendRecommendation: "send" | "review" | "hold"

  // Status
  status: DraftStatus
  mergedWithId?: string

  // Metadata
  generatedFromOpportunityId?: string
  generatedFromActionId?: string
  editedAt?: string
  editedBy?: string
  sentAt?: string
  sentBy?: string
  createdAt: string
}

// ============================================================================
// INTERACTIONS & OUTCOMES
// ============================================================================

export interface InteractionLog {
  id: string
  memberId: string
  type: "dm" | "call" | "email" | "event" | "intro" | "perk"
  channel: string
  summary: string
  draftId?: string
  createdBy: string
  createdAt: string
}

export interface OutcomeFeedback {
  id: string
  memberId: string
  interactionId: string
  rating: number // 1-10
  feedback?: string // Required if rating < 6
  escalated: boolean
  escalationReason?: string
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
}

// ============================================================================
// INTROS
// ============================================================================

export type IntroStatus = "suggested" | "pending" | "accepted" | "declined" | "completed"

export interface IntroSuggestion {
  id: string
  memberAId: string
  memberBId: string
  rationale: string
  impactScore: number
  matchingFactIds: string[]
  dismissed: boolean
  createdAt: string
}

export interface IntroRecord {
  id: string
  memberAId: string
  memberBId: string
  status: IntroStatus
  suggestionId?: string
  messageToA?: string
  messageToB?: string
  outcomeA?: {
    rating: number
    feedback?: string
  }
  outcomeB?: {
    rating: number
    feedback?: string
  }
  createdBy: string
  createdAt: string
  completedAt?: string
}

// ============================================================================
// PERKS
// ============================================================================

export type PerkCategory = "saas" | "service" | "event" | "content" | "community" | "discount"

export interface Perk {
  id: string
  tenantId: TenantId
  name: string
  description: string
  category: PerkCategory
  partnerName: string
  partnerLogo?: string
  value?: string // e.g., "$5,000 credits"
  url?: string
  expiresAt?: string
  active: boolean
  createdAt: string
}

export interface PerkRecommendation {
  id: string
  memberId: string
  perkId: string
  rationale: string
  impactScore: number
  matchingFactIds: string[]
  dismissed: boolean
  deliveredAt?: string
  createdAt: string
}

export type PartnerApplicationStatus = "pending" | "approved" | "rejected"

export interface PerkPartnerApplication {
  id: string
  tenantId: TenantId
  companyName: string
  contactName: string
  contactEmail: string
  perkDescription: string
  status: PartnerApplicationStatus
  reviewedBy?: string
  reviewedAt?: string
  notes?: string
  createdAt: string
}

// ============================================================================
// PROGRAMMING
// ============================================================================

export interface MastermindGroup {
  id: string
  tenantId: TenantId
  name: string
  theme?: string
  memberIds: string[]
  leaderId: string
  nextSessionAt?: string
  rotationSchedule: string[]
  agendaDraft?: string
  followUpItems: {
    memberId: string
    item: string
    dueAt?: string
    completed: boolean
  }[]
  createdAt: string
}

export interface MonthlyClubAgenda {
  id: string
  tenantId: TenantId
  month: string // YYYY-MM
  themes: string[]
  template: string
  speakers: {
    name: string
    topic: string
    confirmed: boolean
  }[]
  workshops: {
    id: string
    title: string
    status: "planned" | "confirmed" | "completed"
  }[]
  createdAt: string
  updatedAt: string
}

export interface WorkshopPlan {
  id: string
  tenantId: TenantId
  title: string
  topic: string
  suggestedSpeakers: {
    memberId?: string
    name: string
    rationale: string
  }[]
  targetAudience: string[]
  status: "idea" | "planning" | "scheduled" | "completed"
  scheduledAt?: string
  createdAt: string
}

// ============================================================================
// RESOURCES & KNOWLEDGE
// ============================================================================

export type ResourceType = "playbook" | "template" | "case_study" | "recording" | "article" | "tool"

export interface KnowledgeResource {
  id: string
  tenantId: TenantId
  title: string
  description: string
  type: ResourceType
  tags: string[]
  url?: string
  content?: string
  attachmentUrl?: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

// ============================================================================
// SURVEYS & PODS
// ============================================================================

export type SurveyCadence = "weekly" | "biweekly" | "monthly" | "quarterly"

export interface Survey {
  id: string
  tenantId: TenantId
  memberId: string
  cadence: SurveyCadence
  lastSentAt?: string
  lastCompletedAt?: string
  completionRate: number
  responses: {
    questionId: string
    question: string
    answer: string
    sentiment?: "positive" | "neutral" | "negative"
    deltaSinceLast?: string
  }[]
}

export interface Pod {
  id: string
  tenantId: TenantId
  name: string
  memberIds: string[]
  monthlyGoalsPromptSent: boolean
  monthlyGoalsReceived: string[]
  receiptsShared: string[]
  quietMemberIds: string[]
  createdAt: string
}

// ============================================================================
// ANALYTICS & SEGMENTS
// ============================================================================

export interface MemberWrapped {
  memberId: string
  period: string // YYYY or YYYY-MM
  startSnapshot: {
    goals: string[]
    bottlenecks: string[]
    riskTier: RiskTier
  }
  currentSnapshot: {
    goals: string[]
    bottlenecks: string[]
    riskTier: RiskTier
  }
  highlights: {
    introsReceived: number
    perksUsed: number
    eventsAttended: number
    resourcesAccessed: number
    sentimentTrend: "improving" | "stable" | "declining"
  }
  wins: string[]
  generatedAt: string
}

export interface PersonaCluster {
  id: string
  tenantId: TenantId
  name: string
  description: string
  memberIds: string[]
  characteristics: string[]
  suggestedUses: string[]
  createdAt: string
}

// ============================================================================
// VELOCITY (CHALLENGES)
// ============================================================================

export interface VelocityChallenge {
  id: string
  tenantId: TenantId
  title: string
  theme: string
  participantIds: string[]
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  active: boolean
  createdAt: string
}

export interface VelocityProof {
  id: string
  tenantId: TenantId
  challengeId: string
  memberId: string
  link: string
  description: string
  createdAt: string
}

// ============================================================================
// TENANT SETTINGS
// ============================================================================

export type IntegrationId = "slack" | "recall" | "linkedin" | "careers" | "indeed" | "instagram" | "x"

export interface TenantSettings {
  tenantId: TenantId
  settings: Record<string, unknown>
  updatedAt?: string
}

// ============================================================================
// FORCED SUCCESS
// ============================================================================

export interface ForcedSuccessItem {
  id: string
  memberId: string
  weekOf: string // YYYY-WW
  recommendedActionType: ActionType
  recommendedActions: ActionRecommendation[]
  deliveredActionType?: ActionType
  deliveredAt?: string
  deliveredBy?: string
  draftId?: string
  blocked: boolean
  blockedReason?: string
  createdAt: string
}

// ============================================================================
// AUDIT & ADMIN
// ============================================================================

export type AuditEventType =
  | "member_created"
  | "draft_created"
  | "draft_updated"
  | "draft_sent"
  | "draft_discarded"
  | "draft_merged"
  | "contact_state_changed"
  | "intro_created"
  | "intro_suggestion_dismissed"
  | "opportunity_dismissed"
  | "perk_delivered"
  | "perk_created"
  | "perk_recommendation_dismissed"
  | "resource_created"
  | "pod_created"
  | "survey_sent"
  | "mastermind_group_created"
  | "mastermind_agenda_updated"
  | "monthly_agenda_created"
  | "monthly_agenda_updated"
  | "settings_updated"
  | "velocity_challenge_created"
  | "velocity_proof_created"
  | "forced_success_added"
  | "forced_success_block_overridden"
  | "outcome_recorded"
  | "forced_success_delivered"
  | "fact_updated"
  | "fact_verified"
  | "member_status_changed"
  | "settings_changed"

export interface AuditLogEntry {
  id: string
  tenantId: TenantId
  type: AuditEventType
  actor: string
  actorRole: UserRole
  memberId?: string
  details: Record<string, unknown>
  createdAt: string
}

export interface IntegrationConfig {
  id: string
  tenantId: TenantId
  name: string
  type: "slack" | "recall" | "linkedin" | "careers" | "indeed" | "instagram" | "x"
  enabled: boolean
  config: Record<string, unknown>
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

// ============================================================================
// AI CHAT
// ============================================================================

export interface ChatThread {
  id: string
  tenantId: TenantId
  title: string
  context?: {
    type: "club" | "member"
    memberId?: string
  }
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  evidence?: {
    factIds?: string[]
    signalIds?: string[]
    memberIds?: string[]
  }
  suggestedActions?: ActionRecommendation[]
  createdAt: string
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AuthState {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
  } | null
  tenantId: TenantId
}

export interface NotificationItem {
  id: string
  type: "escalation" | "red_risk" | "blocked_item" | "outcome_due" | "renewal_alert" | "programming_reminder"
  title: string
  description: string
  memberId?: string
  actionUrl?: string
  read: boolean
  createdAt: string
}
