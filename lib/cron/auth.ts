import "server-only"

export function isAuthorizedCronRequest(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) throw new Error("Missing env var: CRON_SECRET")

  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${expected}`
}

