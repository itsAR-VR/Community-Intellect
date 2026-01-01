"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Bot, Send, User, Sparkles, ExternalLink, Menu } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ActionTypeBadge } from "@/components/shared/action-type-badge"
import { mockMembers, mockChatThreads } from "@/lib/mock-data"
import type { TenantId } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

const suggestedPrompts = [
  "Who should I talk to this week?",
  "What matters most to our at-risk members?",
  "Which members need value drops?",
  "Generate a briefing for my next call",
  "What are the top opportunities?",
  "Who could benefit from an intro?",
]

export default function AIChatPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

  const [selectedThread, setSelectedThread] = React.useState<string | null>(null)
  const [input, setInput] = React.useState("")
  const [context, setContext] = React.useState<"club" | "member">("club")
  const [selectedMember, setSelectedMember] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const members = mockMembers.filter((m) => m.tenantId === tenantId)
  const threads = mockChatThreads.filter((t) => t.tenantId === tenantId)
  const currentThread = threads.find((t) => t.id === selectedThread)

  const handleSend = () => {
    if (!input.trim()) return
    setInput("")
  }

  const handleSelectThread = (threadId: string | null) => {
    setSelectedThread(threadId)
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Context selector bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* Mobile thread selector */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
              <Menu className="h-4 w-4 mr-2" />
              History
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <div className="space-y-2">
              <Button className="w-full mb-4" onClick={() => handleSelectThread(null)}>
                New Chat
              </Button>
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleSelectThread(thread.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedThread === thread.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent/50"
                  }`}
                >
                  <p className="font-medium text-sm line-clamp-2">{thread.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                  </p>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        <Select value={context} onValueChange={(v) => setContext(v as "club" | "member")}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="club">Whole Club</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
        {context === "member" && (
          <Select value={selectedMember ?? ""} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.firstName} {member.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Desktop: show current thread title if selected */}
        {currentThread && (
          <div className="hidden lg:flex items-center gap-2 ml-auto text-sm text-muted-foreground">
            <span className="truncate max-w-[200px]">{currentThread.title}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedThread(null)}>
              New Chat
            </Button>
          </div>
        )}
      </div>

      {/* Main chat area */}
      <Card className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6">
            {!currentThread ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-16 space-y-6 max-w-xl mx-auto">
                <div className="rounded-full bg-primary/10 p-4 md:p-6">
                  <Bot className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                </div>
                <div className="text-center px-4">
                  <h2 className="text-lg md:text-xl font-semibold mb-2">Club Intelligence Assistant</h2>
                  <p className="text-sm text-muted-foreground">
                    Ask questions about members, get recommendations, generate briefings, and more.
                  </p>
                </div>
                <div className="w-full space-y-2 px-4">
                  <p className="text-xs text-muted-foreground text-center mb-3">Suggested prompts</p>
                  {suggestedPrompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2.5 px-3 bg-transparent"
                      onClick={() => setInput(prompt)}
                    >
                      <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat messages
              <div className="space-y-4 max-w-2xl mx-auto">
                {currentThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg p-3 md:p-4 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {message.evidence && message.evidence.memberIds && message.evidence.memberIds.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex flex-wrap gap-2">
                            {message.evidence.memberIds.map((memberId) => {
                              const member = mockMembers.find((m) => m.id === memberId)
                              if (!member) return null
                              return (
                                <Link
                                  key={memberId}
                                  href={`/app/${tenantId}/members/${memberId}`}
                                  className="inline-flex items-center gap-1 text-xs bg-background/50 rounded px-2 py-1 hover:bg-background"
                                >
                                  {member.firstName} {member.lastName}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          <p className="text-xs font-medium">Suggested Actions</p>
                          {message.suggestedActions.map((action) => (
                            <div key={action.id} className="flex items-center gap-2">
                              <ActionTypeBadge type={action.type} size="sm" />
                              <span className="text-xs">{action.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="bg-muted">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area - fixed at bottom */}
        <div className="p-3 md:p-4 border-t border-border">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              placeholder="Ask about your members..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
