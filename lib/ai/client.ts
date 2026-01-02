import "server-only"

import OpenAI from "openai"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (_client) return _client
  _client = new OpenAI({ apiKey: mustGetEnv("OPENAI_API_KEY") })
  return _client
}

