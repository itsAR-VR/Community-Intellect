export type SlackIdentityRow = {
  id: string
  tenantId: string
  memberId: string
  teamId: string
  slackUserId: string
  slackEmail?: string
  slackDisplayName?: string
  createdAt?: string
  updatedAt?: string
}

export type SlackDmThreadRow = {
  id: string
  tenantId: string
  memberId: string
  teamId: string
  slackChannelId: string
  lastMessageAt?: string
  lastMemberMessageAt?: string
  lastCmMessageAt?: string
  memberRepliedAt?: string
  conversationClosedAt?: string
  createdAt?: string
  updatedAt?: string
}

