"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { useAuth } from "@/hooks/useAuth"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

type AuthGuardProps = {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const { isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return fallback ?? <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return fallback ?? null
  }

  return <>{children}</>
}
