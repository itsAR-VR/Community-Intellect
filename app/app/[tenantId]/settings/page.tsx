"use client"

import { useParams } from "next/navigation"
import { MessageSquare, Video, Linkedin, Briefcase, Search, Instagram, Twitter, RefreshCw, Save } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TenantId } from "@/lib/types"

const integrations = [
  { id: "slack", name: "Slack", icon: MessageSquare, connected: true, lastSync: "2 hours ago" },
  { id: "recall", name: "Recall.ai", icon: Video, connected: true, lastSync: "1 day ago" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, connected: true, lastSync: "4 hours ago" },
  { id: "careers", name: "Careers Pages", icon: Briefcase, connected: true, lastSync: "1 day ago" },
  { id: "indeed", name: "Indeed", icon: Search, connected: false, lastSync: null },
  { id: "instagram", name: "Instagram", icon: Instagram, connected: false, lastSync: null },
  { id: "x", name: "X (Twitter)", icon: Twitter, connected: false, lastSync: null },
]

export default function SettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as TenantId

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
            {integrations.map((integration) => {
              const Icon = integration.icon

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
                          {integration.lastSync && (
                            <p className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</p>
                          )}
                        </div>
                      </div>
                      <Badge variant={integration.connected ? "default" : "secondary"}>
                        {integration.connected ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    {integration.connected ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Sync
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Configure
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" className="w-full">
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
                <div className="flex items-center justify-between">
                  <div>
                    <Label>LinkedIn Scraping</Label>
                    <p className="text-sm text-muted-foreground">Check company pages for updates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Every</span>
                    <Input type="number" defaultValue={24} className="w-20" />
                    <span className="text-sm">hours</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Careers Page Monitoring</Label>
                    <p className="text-sm text-muted-foreground">Check for new job postings</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Every</span>
                    <Input type="number" defaultValue={12} className="w-20" />
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
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Autosend</Label>
                  <p className="text-sm text-muted-foreground">Allow system to send approved drafts automatically</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Impact Score</Label>
                  <span className="text-sm font-medium">60</span>
                </div>
                <Slider defaultValue={[60]} max={100} step={5} />
                <p className="text-xs text-muted-foreground">
                  Only auto-send drafts with impact score above this threshold
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Recent Activity</Label>
                  <p className="text-sm text-muted-foreground">Member must have engaged in last 7 days</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Respect Contact State</Label>
                  <p className="text-sm text-muted-foreground">Never auto-send to closed/muted contacts</p>
                </div>
                <Switch defaultChecked />
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
                    <Input type="number" defaultValue={30} className="w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Yellow (Medium Risk)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">31 -</span>
                    <Input type="number" defaultValue={60} className="w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Red (High Risk)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">61 - 100</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>Configure user roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Admin</h4>
                    <Badge>Full Access</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Can manage all settings, users, and perform all actions
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Community Manager</h4>
                    <Badge variant="secondary">Limited Access</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Can manage members, drafts, intros, and perks. Cannot change settings.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Read Only</h4>
                    <Badge variant="outline">View Only</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Can view all data but cannot make any changes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
