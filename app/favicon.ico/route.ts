import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

export async function GET() {
  const file = await readFile(path.join(process.cwd(), "public", "icon-light-32x32.png"))
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=86400",
    },
  })
}
