"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { useAuth } from "@/hooks/useAuth"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { safeNextPath } from "@/lib/share/safeNext"

type AuthGuardProps = {
	children: ReactNode
	fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
	const router = useRouter()
	const { isLoading, isAuthenticated } = useAuth()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!mounted || isLoading || isAuthenticated) return
		const next = safeNextPath(
			`${window.location.pathname}${window.location.search}`,
		)
		const login =
			next !== "/" ? `/login?next=${encodeURIComponent(next)}` : "/login"
		router.replace(login)
	}, [mounted, isAuthenticated, isLoading, router])

	// Keep SSR and the first client paint identical (spinner), then resolve auth.
	if (!mounted || isLoading) {
		return fallback ?? <LoadingSpinner />
	}

	if (!isAuthenticated) {
		return fallback ?? null
	}

	return <>{children}</>
}
