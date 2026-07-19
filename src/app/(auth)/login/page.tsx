"use client"

import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { AuthDivider } from "@/components/auth/AuthDivider"
import { AuthInput } from "@/components/auth/AuthInput"
import { CineAILogo } from "@/components/auth/CineAILogo"
import { AuthSidePanel } from "@/components/auth/AuthSidePanel"
import { SocialAuthButton } from "@/components/auth/SocialAuthButton"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { resendVerification, signIn } from "@/lib/auth/auth-client"
import { stripAtSign } from "@/lib/utils/username"

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      setError("Please enter your credentials")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const normalizedIdentifier = identifier.trim()
      const looksLikeEmail = normalizedIdentifier.includes("@") && normalizedIdentifier.includes(".")

      const result = looksLikeEmail
        ? await signIn.email({
            email: normalizedIdentifier.toLowerCase(),
            password,
            callbackURL: "/",
          })
        : await signIn.username({
            username: stripAtSign(normalizedIdentifier).toLowerCase(),
            password,
            callbackURL: "/",
          })

      if (result.error) {
        if (result.error.message?.toLowerCase().includes("verify")) {
          setError("Please verify your email first.")
        } else {
          setError(result.error.message || "Invalid credentials")
        }
        return
      }

      window.location.replace("/")
    } catch {
      setError("Unable to sign in right now. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <AuthSidePanel
          title="Discover your next obsession."
          subtitle="Tell us your mood, and CineAI will surface films that actually fit your taste, not generic top charts."
        />

        <div className="flex items-center justify-center p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <CineAILogo size="md" />
              <h1 className="mt-5 font-playfair text-4xl text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-white/60">Sign in to continue</p>
            </div>

            <div className="mt-6">
              <SocialAuthButton provider="google" onClick={() => signIn.social({ provider: "google", callbackURL: "/" })} text="Continue with Google" isLoading={isLoading} />
            </div>

            <div className="my-5">
              <AuthDivider text="or sign in with email" />
            </div>

            <div className="space-y-4">
              <AuthInput
                label="Email or Username"
                value={identifier}
                onChange={setIdentifier}
                placeholder="your@email.com or @username"
                icon={User}
                disabled={isLoading}
              />

              <p className="-mt-2 text-xs text-white/30">You can sign in with your email or @username</p>

              <AuthInput
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Your password"
                type={showPassword ? "text" : "password"}
                icon={Lock}
                disabled={isLoading}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-white/50">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <div className="mt-3 text-right">
              <Link href="/forgot-password" className="text-sm text-[#C9A84C]">
                Forgot password?
              </Link>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808] disabled:opacity-70"
            >
              {isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Sign In"}
            </button>

            {error ? (
              <div className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                {error.toLowerCase().includes("verify") ? (
                  <button
                    type="button"
                    onClick={() => void resendVerification({ email: identifier })}
                    className="mt-2 text-xs text-[#C9A84C]"
                  >
                    Resend verification email
                  </button>
                ) : null}
              </div>
            ) : null}

            <p className="mt-5 text-center text-sm text-white/50">
              Don&apos;t have an account? <Link href="/signup" className="text-[#C9A84C]">Sign Up</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
