"use client"

import { useSession } from "@/lib/auth/auth-client"

function hasCompletedUsername(user?: {
	username?: string | null
	usernameIsTemporary?: boolean | null
} | null) {
	if (!user?.username) return false
	if (user.usernameIsTemporary) return false
	if (user.username.startsWith("temp_")) return false
	return true
}

export function useAuth() {
	const { data: session, isPending: isLoading } = useSession()

	return {
		user: session?.user ?? null,
		session,
		isLoading,
		isAuthenticated: Boolean(session?.user),
		hasUsername: hasCompletedUsername(session?.user),
		isEmailVerified: Boolean(session?.user?.emailVerified),
	}
}
