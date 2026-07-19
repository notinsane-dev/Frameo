import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth/auth"

const PROTECTED_PATHS = ["/profile", "/recommendations", "/watchlist", "/friends"]
const USERNAME_REQUIRED_PATHS = ["/", "/explore", "/movie"]
const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"]

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const session = await auth.api.getSession({ headers: request.headers })

  const hasSession = Boolean(session?.user)
  const hasUsername = Boolean(session?.user?.username)

  const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  const isUsernameRequiredPath = USERNAME_REQUIRED_PATHS.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path),
  )
  const isAuthPage = AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`))

  if (!hasSession && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (hasSession && !hasUsername && isUsernameRequiredPath && pathname !== "/setup-username") {
    return NextResponse.redirect(new URL("/setup-username", request.url))
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL(hasUsername ? "/" : "/setup-username", request.url))
  }

  if (!hasSession && pathname === "/setup-username") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (hasSession && pathname === "/setup-username" && hasUsername) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
