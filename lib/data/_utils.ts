import "server-only"

export function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null || value === undefined ? undefined : value
}

export function dateToIso(value: Date): string {
  return value.toISOString()
}

export function dateToIsoOrUndefined(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined
}

export function dateToYmd(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function assertOk<T>(result: { data: T; error: unknown | null }, context: string): T {
  if (result.error) {
    const message = result.error instanceof Error ? result.error.message : String(result.error)
    throw new Error(`${context}: ${message}`)
  }
  return result.data
}
