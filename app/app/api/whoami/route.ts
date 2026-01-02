import { NextResponse } from "next/server"
import { getWhoami } from "@/lib/auth/whoami"

export async function GET() {
  const whoami = await getWhoami()
  return NextResponse.json({ whoami })
}

