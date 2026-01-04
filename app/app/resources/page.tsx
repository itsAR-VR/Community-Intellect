import { getResources } from "@/lib/data"
import { CLUB_TENANT_ID } from "@/lib/club"
import { ResourcesClient } from "./resources-client"

export default async function ResourcesPage() {
  const resources = await getResources(CLUB_TENANT_ID)
  return <ResourcesClient resources={resources} />
}
