"use client"

import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { AuthInput } from "@/components/auth/AuthInput"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { requestPasswordReset } from "@/lib/auth/auth-client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const sendReset = async () => {
    setError("")
    setIsLoading(true)

    const result = await requestPasswordReset({
      email: email.trim().toLowerCase(),
      redirectTo: "/reset-password",
    })

    setIsLoading(false)

    if (result.error) {
      setError(result.error.message || "Failed to send reset link")
      return
    }

    setIsSubmitted(true)
    setResendCooldown(60)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-white/60">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {!isSubmitted ? (
          <>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-playfair text-4xl text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm text-white/60">Enter your email and we&apos;ll send you a reset link</p>

            <div className="mt-5 space-y-4">
              <AuthInput label="Email" value={email} onChange={setEmail} placeholder="you@example.com" disabled={isLoading} />

              <button
                type="button"
                onClick={sendReset}
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808] disabled:opacity-70"
              >
                {isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Send Reset Link"}
              </button>
            </div>

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </>
        ) : (
          <>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-playfair text-4xl text-white">Reset link sent!</h1>
            <p className="mt-2 text-sm text-white/60">Check your email for the password reset link. It expires in 1 hour.</p>

            <button
              type="button"
              onClick={sendReset}
              disabled={resendCooldown > 0}
              className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 disabled:opacity-60"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
            </button>

            <div className="mt-4">
              <Link href="/login" className="text-sm text-[#C9A84C]">Back to login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
