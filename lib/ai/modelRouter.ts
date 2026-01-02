import "server-only"

export type AiTask = "classify_signal" | "draft_message" | "generate_post" | "chat"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export function modelForTask(task: AiTask): string {
  switch (task) {
    case "classify_signal":
      return mustGetEnv("OPENAI_MODEL_LIGHT")
    case "draft_message":
      return mustGetEnv("OPENAI_MODEL_STANDARD")
    case "generate_post":
      return mustGetEnv("OPENAI_MODEL_STANDARD")
    case "chat":
      return mustGetEnv("OPENAI_MODEL_COMPLEX")
    default: {
      const _exhaustive: never = task
      return _exhaustive
    }
  }
}
