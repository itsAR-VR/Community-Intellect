"use client"
import Link from "next/link"
import { Bell, AlertTriangle, AlertCircle, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockNotifications } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"

const iconMap = {
  escalation: AlertTriangle,
  red_risk: AlertCircle,
  blocked_item: Clock,
  outcome_due: Clock,
  renewal_alert: Calendar,
}

const colorMap = {
  escalation: "text-warning",
  red_risk: "text-destructive",
  blocked_item: "text-muted-foreground",
  outcome_due: "text-primary",
  renewal_alert: "text-warning",
}

export function Notifications() {
  const unreadCount = mockNotifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {mockNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            mockNotifications.map((notification) => {
              const Icon = iconMap[notification.type]
              const colorClass = colorMap[notification.type]

              return (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link href={notification.actionUrl ?? "#"} className="flex items-start gap-3 p-3 cursor-pointer">
                    <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colorClass}`} />
                    <div className="flex-1 space-y-1">
                      <p
                        className={`text-sm font-medium leading-none ${
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </Link>
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
