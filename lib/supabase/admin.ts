import "server-only"

import { createClient } from "@supabase/supabase-js"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function createSupabaseAdminClient() {
  return createClient(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"), mustGetEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

