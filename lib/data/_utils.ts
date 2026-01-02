import "server-only"

export function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value
}

export function assertOk<T>(result: { data: T; error: unknown | null }, context: string): T {
  if (result.error) {
    const message = result.error instanceof Error ? result.error.message : String(result.error)
    throw new Error(`${context}: ${message}`)
  }
  return result.data
}

