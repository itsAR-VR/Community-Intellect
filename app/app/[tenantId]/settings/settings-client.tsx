"use client"

import * as React from "react"
import { MessageSquare, Video, Linkedin, Briefcase, Search, Instagram, Twitter, RefreshCw, Save, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import type { TenantId, IntegrationId, UserRole } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

type IntegrationSettings = { connected?: boolean; lastSyncAt?: string | null }

const integrationMeta: Array<{
  id: IntegrationId
  name: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "slack", name: "Slack", icon: MessageSquare },
  { id: "recall", name: "Recall.ai", icon: Video },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "careers", name: "Careers Pages", icon: Briefcase },
  { id: "indeed", name: "Indeed", icon: Search },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "x", name: "X (Twitter)", icon: Twitter },
]

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc, key) => (acc && typeof acc === "object" ? (acc as any)[key] : undefined), obj)
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const keys = path.split(".")
  const next = { ...obj }
  let cur: any = next
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!
    const existing = cur[k]
    cur[k] = existing && typeof existing === "object" ? { ...(existing as any) } : {}
    cur = cur[k]
  }
  cur[keys[keys.length - 1]!] = value
  return next
}

export function SettingsClient({
  tenantId,
  initialSettings,
  tenantUsers,
  isAdmin,
}: {
  tenantId: TenantId
  initialSettings: Record<string, unknown>
  tenantUsers: Array<{ id: string; email: string; fullName: string; role: UserRole }>
  isAdmin: boolean
}) {
  const [settings, setSettings] = React.useState<Record<string, unknown>>(initialSettings ?? {})
  const [isSaving, setIsSaving] = React.useState(false)

  const integrations = (getNested(settings, "integrations") as Record<string, IntegrationSettings> | undefined) ?? {}

  const cadenceLinkedInHours = Number(getNested(settings, "cadence.linkedinHours") ?? 24)
  const cadenceCareersHours = Number(getNested(settings, "cadence.careersHours") ?? 12)

  const autosendEnabled = Boolean(getNested(settings, "autosend.enabled") ?? true)
  const minImpactScore = Number(getNested(settings, "autosend.minImpactScore") ?? 60)
  const requireRecentActivity = Boolean(getNested(settings, "autosend.requireRecentActivity") ?? true)
  const respectContactState = Boolean(getNested(settings, "autosend.respectContactState") ?? true)

  const greenMax = Number(getNested(settings, "riskThresholds.greenMax") ?? 30)
  const yellowMax = Number(getNested(settings, "riskThresholds.yellowMax") ?? 60)

  const saveSettings = async (next: Record<string, unknown>) => {
    setIsSaving(true)
    try {
      const res = await fetch("/app/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId, settings: next }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Settings saved" })
      setSettings(next)
    } catch (e) {
      toast({ title: "Failed to save settings", description: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure integrations and system preferences</p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="cadence">Cadence & Thresholds</TabsTrigger>
          <TabsTrigger value="roles">Role Management</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {integrationMeta.map((integration) => {
              const Icon = integration.icon
              const state = integrations[integration.id] ?? {}
              const connected = Boolean(state.connected)
              const lastSyncAt = state.lastSyncAt ? new Date(state.lastSyncAt) : null

              return (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-muted p-2">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{integration.name}</p>
                          {lastSyncAt && (
                            <p className="text-xs text-muted-foreground">
                              Last sync: {formatDistanceToNow(lastSyncAt, { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant={connected ? "default" : "secondary"}>{connected ? "Connected" : "Not Connected"}</Badge>
                    </div>

                    {connected ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={async () => {
                            const next = setNested(settings, `integrations.${integration.id}.lastSyncAt`, new Date().toISOString())
                            await saveSettings(next)
                          }}
                          disabled={isSaving}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Sync
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent"
                          onClick={() => toast({ title: "Configure", description: "Integration configuration UI is saved via Settings for now." })}
                        >
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={isSaving}
                        onClick={async () => {
                          const next1 = setNested(settings, `integrations.${integration.id}.connected`, true)
                          const next2 = setNested(next1, `integrations.${integration.id}.lastSyncAt`, new Date().toISOString())
                          await saveSettings(next2)
                        }}
                      >
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="cadence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>External Signal Refresh</CardTitle>
              <CardDescription>How often to check external sources for new signals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label>LinkedIn Scraping</Label>
                    <p className="text-sm text-muted-foreground">Check company pages for updates</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm">Every</span>
                    <Input
                      type="number"
                      value={cadenceLinkedInHours}
                      onChange={(e) => setSettings((s) => setNested(s, "cadence.linkedinHours", Number(e.target.value)))}
                      className="w-20"
                    />
                    <span className="text-sm">hours</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label>Careers Page Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Check for new job postings</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm">Every</span>
                    <Input
                      type="number"
                      value={cadenceCareersHours}
                      onChange={(e) => setSettings((s) => setNested(s, "cadence.careersHours", Number(e.target.value)))}
                      className="w-20"
                    />
                    <span className="text-sm">hours</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Autosend Rules</CardTitle>
              <CardDescription>Configure when messages can be auto-sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Enable Autosend</Label>
                  <p className="text-sm text-muted-foreground">Allow system to send approved drafts automatically</p>
                </div>
                <Switch checked={autosendEnabled} onCheckedChange={(v) => setSettings((s) => setNested(s, "autosend.enabled", v))} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Impact Score</Label>
                  <span className="text-sm font-medium">{minImpactScore}</span>
                </div>
                <Slider
                  value={[minImpactScore]}
                  max={100}
                  step={5}
                  onValueChange={(v) => setSettings((s) => setNested(s, "autosend.minImpactScore", v[0] ?? 60))}
                />
                <p className="text-xs text-muted-foreground">Only auto-send drafts with impact score above this threshold</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Require Recent Activity</Label>
                  <p className="text-sm text-muted-foreground">Member must have engaged in last 7 days</p>
                </div>
                <Switch
                  checked={requireRecentActivity}
                  onCheckedChange={(v) => setSettings((s) => setNested(s, "autosend.requireRecentActivity", v))}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <Label>Respect Contact State</Label>
                  <p className="text-sm text-muted-foreground">Never auto-send to closed/muted contacts</p>
                </div>
                <Switch
                  checked={respectContactState}
                  onCheckedChange={(v) => setSettings((s) => setNested(s, "autosend.respectContactState", v))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Score Thresholds</CardTitle>
              <CardDescription>Define risk tier boundaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Green (Low Risk)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">0 -</span>
                    <Input
                      type="number"
                      value={greenMax}
                      onChange={(e) => setSettings((s) => setNested(s, "riskThresholds.greenMax", Number(e.target.value)))}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Yellow (Medium Risk)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{greenMax + 1} -</span>
                    <Input
                      type="number"
                      value={yellowMax}
                      onChange={(e) => setSettings((s) => setNested(s, "riskThresholds.yellowMax", Number(e.target.value)))}
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Red (High Risk)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{yellowMax + 1} - 100</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button disabled={isSaving} onClick={() => void saveSettings(settings)}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {!isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>Role Management</CardTitle>
                <CardDescription>Only admins can manage roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Ask an admin to grant access or change roles.</div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Role Management
                </CardTitle>
                <CardDescription>Manage global roles for users with access to this tenant.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {tenantUsers.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No users found for this tenant.</div>
                ) : (
                  tenantUsers.map((u) => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border p-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{u.fullName || u.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={u.role}
                          onValueChange={async (role) => {
                            try {
                              const res = await fetch("/app/api/admin/set-user-role", {
                                method: "POST",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ tenantId, userId: u.id, role }),
                              })
                              if (!res.ok) throw new Error(await res.text())
                              toast({ title: "Role updated" })
                            } catch (e) {
                              toast({ title: "Failed to update role", description: e instanceof Error ? e.message : "Unknown error" })
                            }
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="community_manager">Community Manager</SelectItem>
                            <SelectItem value="read_only">Read Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

