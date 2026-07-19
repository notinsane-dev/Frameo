"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useAuth } from "@/hooks/useAuth"

export default function VerifyEmailPage() {
  const router = useRouter()
  const { user, isLoading, isEmailVerified, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && isEmailVerified) {
      const timer = setTimeout(() => router.push("/setup-username"), 2000)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, isEmailVerified, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-white/60">Verifying your email...</p>
      </div>
    )
  }

  if (isAuthenticated && isEmailVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <h1 className="mt-4 font-playfair text-4xl text-white">Email verified!</h1>
          <p className="mt-2 text-sm text-white/60">Welcome to CineAI, {user?.name}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <h1 className="mt-4 font-playfair text-4xl text-white">Verification failed</h1>
        <p className="mt-2 text-sm text-white/60">This link may have expired.</p>
        <Link href="/signup" className="mt-5 inline-block text-[#C9A84C]">
          Request new link
        </Link>
      </div>
    </div>
  )
}