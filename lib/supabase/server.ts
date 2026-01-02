import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"), mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components can't set cookies; middleware/route handlers will.
        }
      },
    },
  })
}
