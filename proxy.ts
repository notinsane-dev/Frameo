import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth/auth"
import { safeNextPath } from "@/lib/share/safeNext"

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
	const isAuthPage = AUTH_PAGES.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	)

	if (!hasSession && isProtectedRoute) {
		const next = safeNextPath(`${pathname}${request.nextUrl.search}`)
		const loginUrl = new URL("/login", request.url)
		if (next !== "/") loginUrl.searchParams.set("next", next)
		return NextResponse.redirect(loginUrl)
	}

	if (hasSession && !hasUsername && isUsernameRequiredPath && pathname !== "/setup-username") {
		return NextResponse.redirect(new URL("/setup-username", request.url))
	}

	if (hasSession && isAuthPage) {
		const next = safeNextPath(request.nextUrl.searchParams.get("next"))
		return NextResponse.redirect(
			new URL(hasUsername ? next : "/setup-username", request.url),
		)
	}

	if (!hasSession && pathname === "/setup-username") {
		return NextResponse.redirect(new URL("/login", request.url))
	}

	if (hasSession && pathname === "/setup-username" && hasUsername) {
		const next = safeNextPath(request.nextUrl.searchParams.get("next"))
		return NextResponse.redirect(new URL(next, request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
