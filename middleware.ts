import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

function mustGetEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

function maybeRedirectLegacyTenantPath(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/app/api/")) return null

  // Legacy multi-tenant URLs looked like `/app/:tenantId/...`.
  // The app is now single-tenant, so we strip the tenant segment.
  const match = pathname.match(/^\/app\/(b2b|founders)(?:\/(.*))?$/)
  if (!match) return null

  const rest = match[2] ?? "overview"
  const url = request.nextUrl.clone()
  url.pathname = `/app/${rest}`
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const legacyRedirect = maybeRedirectLegacyTenantPath(request)
  if (legacyRedirect) return legacyRedirect

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.headers.set("x-request-id", requestId)

  const supabase = createServerClient(mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"), mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isProtected = pathname.startsWith("/app/")

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/app/:path*"],
}
