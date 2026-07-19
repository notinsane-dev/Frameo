"use client"

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Plus, User, UserRound, XCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"

import { AuthDivider } from "@/components/auth/AuthDivider"
import { AuthInput } from "@/components/auth/AuthInput"
import { CineAILogo } from "@/components/auth/CineAILogo"
import { AuthSidePanel } from "@/components/auth/AuthSidePanel"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { SocialAuthButton } from "@/components/auth/SocialAuthButton"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { resendVerification, signIn, signUp } from "@/lib/auth/auth-client"
import { trpc } from "@/lib/trpc/client"
import { generateUsernameSuggestions } from "@/lib/utils/username"
import { useToastContext } from "@/components/shared/ToastProvider"

type Step = "details" | "verify-email"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const IS_TEST_MODE = process.env.NEXT_PUBLIC_RESEND_ALLOW_TEST_MODE === "true"

export default function SignupPage() {
  const router = useRouter()
  const { showToast } = useToastContext()
  const [step, setStep] = useState<Step>("details")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [debouncedUsername, setDebouncedUsername] = useState("")
  const [isUsernameFocused, setIsUsernameFocused] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const usernameAvailability = trpc.user.checkUsernameAvailable.useQuery(
    { username: debouncedUsername || "_" },
    { enabled: debouncedUsername.length >= 3 && USERNAME_REGEX.test(debouncedUsername) },
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase())
    }, 500)
    return () => window.clearTimeout(timer)
  }, [username])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const passwordsMatch = useMemo(() => password.length > 0 && password === confirmPassword, [password, confirmPassword])
  const usernameSuggestions = useMemo(() => generateUsernameSuggestions(name || "cineaiuser"), [name])

  const usernameStatus = useMemo(() => {
    if (!username.trim()) return null
    if (username.trim().length < 3) return "short" as const
    if (!USERNAME_REGEX.test(username.trim())) return "invalid" as const
    if (usernameAvailability.isFetching) return "checking" as const
    return usernameAvailability.data?.available ? "available" as const : "taken" as const
  }, [username, usernameAvailability.data?.available, usernameAvailability.isFetching])

  const validateDimensions = async (file: File) => {
    const localUrl = URL.createObjectURL(file)
    try {
      const image = new window.Image()
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        image.onload = () => resolve({ width: image.width, height: image.height })
        image.onerror = () => reject(new Error("Failed to read image"))
        image.src = localUrl
      })
      if (dimensions.width < 100 || dimensions.height < 100) {
        throw new Error("Image must be at least 100x100")
      }
    } finally {
      URL.revokeObjectURL(localUrl)
    }
  }

  const handleSignup = async () => {
    if (isLoading) return

    if (!name.trim()) {
      setError("Please enter your full name")
      return
    }

    const normalizedUsername = username.trim().toLowerCase()
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      setError("Username must be 3-20 characters with letters, numbers, and underscores")
      return
    }

    if (!usernameAvailability.data?.available) {
      setError("Username is not available")
      return
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email")
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

    setError("")
    setIsLoading(true)

    const result = await signUp.email({
      name: name.trim(),
      username: normalizedUsername,
      email: email.trim().toLowerCase(),
      password,
      callbackURL: "/",
    })

    setIsLoading(false)

    if (result.error) {
      setError(result.error.message || "Failed to create account")
      return
    }

    if (avatarFile) {
      try {
        const formData = new FormData()
        formData.append("avatar", avatarFile)
        await fetch("/api/upload/avatar", { method: "POST", body: formData })
      } catch {
        showToast("Account created, but avatar upload failed", "info")
      }
    }

    if (IS_TEST_MODE) {
      showToast("Account created", "success")
      router.push("/")
      return
    }

    setStep("verify-email")
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return

    await resendVerification({ email })
    setResendCooldown(60)
    showToast("Email sent!", "success")
  }

  const handleAvatarFile = async (file: File) => {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Avatar must be JPEG, PNG, or WEBP")
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Avatar must be 2MB or less")
      return
    }

    try {
      await validateDimensions(file)
    } catch (dimensionError) {
      setError(dimensionError instanceof Error ? dimensionError.message : "Invalid image")
      return
    }

    setError("")
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  if (step === "verify-email") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#C9A84C]/15 text-[#C9A84C]">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="font-playfair text-4xl text-white">Check your email</h1>
          <p className="mt-3 text-white/60">We sent a verification link to</p>
          <span className="mt-3 inline-flex rounded-full bg-[#C9A84C]/15 px-4 py-1 text-sm text-[#C9A84C]">{email}</span>
          <p className="mt-5 text-sm text-white/50">Click the link in the email to verify your account and continue.</p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="mt-6 rounded-full border border-white/15 px-5 py-2 text-sm text-white/80 disabled:opacity-60"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
          </button>

          <button type="button" onClick={() => setStep("details")} className="mt-3 block w-full text-sm text-white/40">
            Wrong email? Go back
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <AuthSidePanel
          title="Discover your next obsession."
          subtitle="Create your profile, lock in your vibe, and get recommendations that feel handpicked for your next watch."
        />

        <div className="flex items-center justify-center p-4 md:p-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-7">
            <CineAILogo size="md" />
            <h1 className="mt-6 font-playfair text-4xl text-white">Create your account</h1>
            <p className="mt-2 text-sm text-white/60">Join CineAI and discover movies you'll love</p>

            <div className="mt-6">
              <SocialAuthButton
                provider="google"
                onClick={() => signIn.social({ provider: "google", callbackURL: "/setup-username" })}
                text="Continue with Google"
                isLoading={isLoading}
              />
            </div>

            <div className="my-5">
              <AuthDivider text="or sign up with email" />
            </div>

            <div className="space-y-4">
              <AuthInput label="Full Name" value={name} onChange={setName} placeholder="Your full name" icon={User} disabled={isLoading} />

              <div className="text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleAvatarFile(file)
                    }
                    event.target.value = ""
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/15"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2b2b2b] to-[#111111]">
                      <UserRound className="h-8 w-8 text-white/65" />
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C9A84C] text-[#080808]">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </button>
                <p className="mt-2 text-xs text-white/50">Upload photo (optional)</p>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">Username</label>
                <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <span className="border-r border-white/10 bg-white/5 px-3 py-3 text-white/40">@</span>
                  <input
                    value={username}
                    onFocus={() => setIsUsernameFocused(true)}
                    onBlur={() => setIsUsernameFocused(false)}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="username"
                    className="flex-1 bg-transparent px-3 py-3 text-white outline-none"
                    maxLength={20}
                  />
                  <span className="px-3">
                    {usernameStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin text-white/40" /> : null}
                    {usernameStatus === "available" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
                    {usernameStatus === "taken" || usernameStatus === "invalid" ? <XCircle className="h-4 w-4 text-red-400" /> : null}
                  </span>
                </div>
                {usernameStatus === "short" ? <p className="mt-1 text-xs text-white/30">Min 3 characters</p> : null}
                {usernameStatus === "invalid" ? <p className="mt-1 text-xs text-red-400/80">Letters, numbers, underscores only</p> : null}
                {usernameStatus === "available" ? <p className="mt-1 text-xs text-emerald-400">Available</p> : null}
                {usernameStatus === "taken" ? <p className="mt-1 text-xs text-red-400/80">Already taken</p> : null}

                {isUsernameFocused ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {usernameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setUsername(suggestion)}
                        className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/60"
                      >
                        @{suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <AuthInput label="Email" value={email} onChange={setEmail} placeholder="your@email.com" type="email" icon={Mail} disabled={isLoading} />

              <div className="space-y-2">
                <AuthInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Min 8 characters"
                  type={showPassword ? "text" : "password"}
                  icon={Lock}
                  disabled={isLoading}
                  rightIcon={
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-white/50">
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
                disabled={isLoading}
                success={passwordsMatch ? "Passwords match" : undefined}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="text-white/50">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <button
              type="button"
              onClick={handleSignup}
              disabled={isLoading}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808] disabled:opacity-70"
            >
              {isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Sign Up"}
            </button>

            <AnimatePresence>
              {error ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-3 flex items-center gap-2 text-sm text-red-400/90">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <p className="mt-5 text-center text-sm text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="text-[#C9A84C]">Sign In</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
