"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Plus, Search, FileText, Video, Wrench, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import type { ResourceType, KnowledgeResource } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

export function ResourcesClient({
  resources,
}: {
  resources: KnowledgeResource[]
}) {
  const router = useRouter()
  const { canEdit } = useAuth()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [type, setType] = React.useState<ResourceType | "">("")
  const [description, setDescription] = React.useState("")
  const [url, setUrl] = React.useState("")
  const [tags, setTags] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<ResourceType | "all">("all")

  const filteredResources = resources.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags.some((t) => t.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  const typeIcons: Record<ResourceType, React.ReactNode> = {
    playbook: <FileText className="h-5 w-5" />,
    template: <FileText className="h-5 w-5" />,
    case_study: <BookOpen className="h-5 w-5" />,
    recording: <Video className="h-5 w-5" />,
    article: <BookOpen className="h-5 w-5" />,
    tool: <Wrench className="h-5 w-5" />,
  }

  const typeLabels: Record<ResourceType, string> = {
    playbook: "Playbook",
    template: "Template",
    case_study: "Case Study",
    recording: "Recording",
    article: "Article",
    tool: "Tool",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground">Knowledge library for members</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canEdit}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Resource</DialogTitle>
              <DialogDescription>Add a resource to the knowledge library</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the resource..."
                />
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="marketing, strategy, growth"
                />
              </div>
              <Button
                className="w-full"
                disabled={!canEdit || isSubmitting || !title || !type || !description}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const res = await fetch("/app/api/resources/create", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({
                        title,
                        type,
                        description,
                        url: url || undefined,
                        tags: tags
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }),
                    })
                    if (!res.ok) throw new Error(await res.text())
                    toast({ title: "Resource added" })
                    setCreateOpen(false)
                    setTitle("")
                    setType("")
                    setDescription("")
                    setUrl("")
                    setTags("")
                    router.refresh()
                  } catch (e) {
                    toast({ title: "Failed to add", description: e instanceof Error ? e.message : "Unknown error" })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                Add Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | "all")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredResources.length} resources</Badge>
      </div>

      {filteredResources.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          description={search || typeFilter !== "all" ? "Try adjusting your filters" : "Add your first resource"}
          action={
            !search && typeFilter === "all" ? (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="hover:bg-accent/30 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">{typeIcons[resource.type]}</div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[resource.type]}
                      </Badge>
                      <span className="text-xs">{resource.viewCount} views</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                <div className="flex flex-wrap gap-1">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{resource.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(resource.updatedAt), { addSuffix: true })}
                  </p>
                  <div className="flex gap-2">
                    {resource.url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm">Send to Member</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
