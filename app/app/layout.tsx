import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell/app-shell"
import { requireWhoami } from "@/lib/auth/whoami"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const whoami = await requireWhoami()
  if (!whoami.club) redirect("/app/forbidden")

  return <AppShell initialWhoami={whoami}>{children}</AppShell>
}

