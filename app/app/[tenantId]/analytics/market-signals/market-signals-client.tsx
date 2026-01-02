"use client"

import * as React from "react"
import { TrendingUp, Send, Copy, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { SourceBadge } from "@/components/shared/source-badge"
import type { TenantId, Member, ExternalSignal } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

export function MarketSignalsClient({ tenantId, members, signals }: { tenantId: TenantId; members: Member[]; signals: ExternalSignal[] }) {
  const router = useRouter()
  const [selectedSignals, setSelectedSignals] = React.useState<string[]>([])
  const [generatedPost, setGeneratedPost] = React.useState("")
  const [isAiGenerating, setIsAiGenerating] = React.useState(false)

  const memberIds = members.map((m) => m.id)

  const recentSignals = signals
    .filter((s) => memberIds.includes(s.memberId))
    .filter((s) => ["hiring", "funding", "expansion", "milestone"].includes(s.type))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  const handleSelectSignal = (signalId: string, checked: boolean) => {
    setSelectedSignals(checked ? [...selectedSignals, signalId] : selectedSignals.filter((id) => id !== signalId))
  }

  const generatePost = () => {
    const selected = recentSignals.filter((s) => selectedSignals.includes(s.id))
    const lines = selected.map((s) => {
      const member = members.find((m) => m.id === s.memberId)
      return `• ${member?.company.name}: ${s.whatHappened}`
    })
    setGeneratedPost(`📊 Weekly Market Signals from the CMO Club\n\n${lines.join("\n\n")}\n\n#B2BMarketing #CMO`)
  }

  const generatePostWithAI = async () => {
    const selected = recentSignals.filter((s) => selectedSignals.includes(s.id))
    const payload = selected
      .map((s) => {
        const member = members.find((m) => m.id === s.memberId)
        if (!member) return null
        return { company: member.company.name, whatHappened: s.whatHappened }
      })
      .filter((x): x is { company: string; whatHappened: string } => !!x)

    if (payload.length === 0) return

    setIsAiGenerating(true)
    try {
      const res = await fetch("/app/api/ai/generate-post", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, signals: payload }),
      })
      if (!res.ok) throw new Error(await res.text())
      const json = (await res.json()) as { post: string }
      setGeneratedPost(json.post)
      toast({ title: "Post generated" })
    } catch (e) {
      toast({ title: "AI generate failed", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsAiGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Signals</h1>
          <p className="text-muted-foreground">Build weekly #market-signals posts from member activity</p>
        </div>
        <Button variant="outline" onClick={() => router.refresh()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Signals
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signal Candidates</CardTitle>
            <CardDescription>Select signals to include in your post</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSignals.map((signal) => {
                const member = members.find((m) => m.id === signal.memberId)
                if (!member) return null

                return (
                  <div
                    key={signal.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      selectedSignals.includes(signal.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-accent/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedSignals.includes(signal.id)}
                      onCheckedChange={(checked) => handleSelectSignal(signal.id, !!checked)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{member.company.name}</span>
                        <SourceBadge source={signal.source} size="sm" />
                        <Badge variant="outline" className="text-xs capitalize">
                          {signal.type}
                        </Badge>
                      </div>
                      <p className="text-sm">{signal.whatHappened}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(signal.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Post</CardTitle>
                <CardDescription>Preview and edit your market signals post</CardDescription>
              </div>
              <Badge variant="secondary">{selectedSignals.length} selected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generatePost} disabled={selectedSignals.length === 0} className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Generate Post
            </Button>
            <Button
              variant="outline"
              onClick={generatePostWithAI}
              disabled={selectedSignals.length === 0 || isAiGenerating}
              className="w-full bg-transparent"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {isAiGenerating ? "Generating…" : "Generate with AI"}
            </Button>

            {generatedPost && (
              <>
                <Textarea value={generatedPost} onChange={(e) => setGeneratedPost(e.target.value)} rows={12} />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(generatedPost)
                        toast({ title: "Copied to clipboard" })
                      } catch {
                        toast({ title: "Copy failed" })
                      }
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button className="flex-1">
                    <Send className="mr-2 h-4 w-4" />
                    Post to Slack
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
