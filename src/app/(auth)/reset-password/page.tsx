"use client"

import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { AuthInput } from "@/components/auth/AuthInput"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { resetPassword } from "@/lib/auth/auth-client"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!token) {
      setError("This reset link is invalid or expired")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setError("")

    const result = await resetPassword({ token, newPassword: password })
    setIsLoading(false)

    if (result.error) {
      setError(result.error.message || "This reset link is invalid or expired")
      return
    }

    setIsSuccess(true)
  }

  if (error.toLowerCase().includes("invalid") || error.toLowerCase().includes("expired")) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <h1 className="mt-4 font-playfair text-4xl text-white">This reset link is invalid or expired</h1>
          <Link href="/forgot-password" className="mt-5 inline-block text-[#C9A84C]">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
          <h1 className="mt-4 font-playfair text-4xl text-white">Password updated!</h1>
          <p className="mt-2 text-sm text-white/60">You can now sign in with your new password</p>
          <Link href="/login" className="mt-5 inline-block rounded-full bg-[#C9A84C] px-4 py-2 text-sm font-medium text-[#080808]">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
          <Lock className="h-7 w-7" />
        </div>

        <h1 className="mt-4 font-playfair text-4xl text-white">Set new password</h1>
        <p className="mt-2 text-sm text-white/60">Enter your new password below</p>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <AuthInput
              label="New Password"
              value={password}
              onChange={setPassword}
              placeholder="New password"
              type={showPassword ? "text" : "password"}
              icon={Lock}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <PasswordStrength password={password} />
          </div>

          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            icon={Lock}
            rightIcon={
              <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808] disabled:opacity-70"
          >
            {isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Update Password"}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>
    </div>
  )
}
