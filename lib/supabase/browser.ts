"use client"

import { createBrowserClient } from "@supabase/ssr"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"), mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
}

