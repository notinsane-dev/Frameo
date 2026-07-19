"use client"

import { useSession } from "@/lib/auth/auth-client"

export function useAuth() {
  const { data: session, isPending: isLoading } = useSession()

  return {
    user: session?.user ?? null,
    session,
    isLoading,
    isAuthenticated: Boolean(session?.user),
    hasUsername: Boolean(session?.user?.username),
    isEmailVerified: Boolean(session?.user?.emailVerified),
  }
}
