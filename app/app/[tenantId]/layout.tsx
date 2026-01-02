import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell/app-shell"
import { requireWhoami } from "@/lib/auth/whoami"
import type { TenantId } from "@/lib/types"

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ tenantId: string }>
}) {
  const whoami = await requireWhoami()
  const { tenantId } = await params
  const typedTenantId = tenantId as TenantId

  const allowed = whoami.tenants.some((t) => t.id === typedTenantId)
  if (!allowed) redirect("/app/forbidden")

  return (
    <AppShell tenantId={typedTenantId} initialWhoami={whoami}>
      {children}
    </AppShell>
  )
}
