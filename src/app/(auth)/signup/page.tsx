"use client"

import {
	AlertCircle,
	CheckCircle2,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	Plus,
	User,
	UserRound,
	XCircle,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"

import { AuthDivider } from "@/components/auth/AuthDivider"
import { AuthInput } from "@/components/auth/AuthInput"
import { AuthCardShell, AuthShell } from "@/components/auth/AuthShell"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { SocialAuthButton } from "@/components/auth/SocialAuthButton"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useClaimInvite } from "@/hooks/useClaimInvite"
import { resendVerification, signIn, signUp } from "@/lib/auth/auth-client"
import { readInviteRef, writeInviteRef } from "@/lib/share/inviteCookie"
import { trpc } from "@/lib/trpc/client"
import { generateUsernameSuggestions } from "@/lib/utils/username"
import { cn } from "@/lib/utils"

type Step = "details" | "verify-email"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_AVATAR_SIZE = 2 * 1024 * 1024
const IS_TEST_MODE = process.env.NEXT_PUBLIC_RESEND_ALLOW_TEST_MODE === "true"

function SignupPageInner() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { showToast } = useToastContext()
	const { claimPendingInvite } = useClaimInvite()
	const refFromQuery = searchParams.get("ref")?.trim().toLowerCase() || ""
	const [inviteRef, setInviteRef] = useState(refFromQuery)
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

	useEffect(() => {
		const timer = setTimeout(() => {
			if (refFromQuery) {
				writeInviteRef(refFromQuery)
				setInviteRef(refFromQuery)
				return
			}
			const fromCookie = readInviteRef()
			if (fromCookie) setInviteRef(fromCookie)
		}, 0)
		return () => clearTimeout(timer)
	}, [refFromQuery])

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

	const passwordsMatch = useMemo(
		() => password.length > 0 && password === confirmPassword,
		[password, confirmPassword],
	)
	const usernameSuggestions = useMemo(
		() => generateUsernameSuggestions(name || "frameouser"),
		[name],
	)

	const usernameStatus = useMemo(() => {
		if (!username.trim()) return null
		if (username.trim().length < 3) return "short" as const
		if (!USERNAME_REGEX.test(username.trim())) return "invalid" as const
		if (usernameAvailability.isFetching) return "checking" as const
		return usernameAvailability.data?.available ? ("available" as const) : ("taken" as const)
	}, [username, usernameAvailability.data?.available, usernameAvailability.isFetching])

	const validateDimensions = async (file: File) => {
		const localUrl = URL.createObjectURL(file)
		try {
			const image = new window.Image()
			const dimensions = await new Promise<{ width: number; height: number }>(
				(resolve, reject) => {
					image.onload = () => resolve({ width: image.width, height: image.height })
					image.onerror = () => reject(new Error("Failed to read image"))
					image.src = localUrl
				},
			)
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
			const claimed = await claimPendingInvite({ redirect: true })
			if (!claimed) router.push("/")
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
			<AuthCardShell>
				<div data-auth-bit className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-signal-muted)] text-[var(--color-signal)]">
					<Mail className="h-6 w-6" />
				</div>
				<h1
					data-auth-bit
					className="mt-6 text-center font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
				>
					Check your email
				</h1>
				<p data-auth-bit className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
					We sent a verification link to
				</p>
				<p
					data-auth-bit
					className="mt-3 text-center font-mono text-sm text-[var(--color-signal)]"
				>
					{email}
				</p>
				<p data-auth-bit className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
					Click the link in the email to verify your account and continue.
				</p>

				<button
					data-auth-bit
					type="button"
					onClick={handleResend}
					disabled={resendCooldown > 0}
					className="mt-6 w-full rounded-lg border border-[var(--color-border)] py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] disabled:opacity-60"
				>
					{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
				</button>

				<button
					data-auth-bit
					type="button"
					onClick={() => setStep("details")}
					className="mt-3 block w-full text-center text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
				>
					Wrong email? Go back
				</button>
			</AuthCardShell>
		)
	}

	return (
		<AuthShell
			panelTitle="Build a taste profile that gets you."
			panelSubtitle="Create your account, lock in your vibe, and get recommendations that feel handpicked."
			heading="Create your account"
			subheading="Join Frameo and find films you'll actually watch"
			footer={
				<>
					Already have an account?{" "}
					<Link
						href="/login"
						className="font-medium text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
					>
						Sign in
					</Link>
				</>
			}
		>
			{inviteRef ? (
				<div
					data-auth-bit
					className="rounded-lg border border-[var(--color-signal-border)] bg-[var(--color-signal-muted)] px-3 py-2 text-sm text-[var(--color-text)]"
				>
					Invited by <span className="font-medium text-[var(--color-signal)]">@{inviteRef}</span>
				</div>
			) : null}

			<div data-auth-bit>
				<SocialAuthButton
					provider="google"
					onClick={async () => {
						setIsLoading(true)
						setError("")
						if (inviteRef) writeInviteRef(inviteRef)
						await signIn.social({
							provider: "google",
							callbackURL: "/setup-username",
						})
					}}
					text="Continue with Google"
					isLoading={isLoading}
				/>
			</div>

			<div data-auth-bit>
				<AuthDivider text="or sign up with email" />
			</div>

			<div data-auth-bit className="space-y-4">
				<AuthInput
					label="Full name"
					value={name}
					onChange={setName}
					placeholder="Your full name"
					icon={User}
					disabled={isLoading}
				/>

				<div className="text-center">
					<input
						ref={fileInputRef}
						type="file"
						accept="image/jpeg,image/png,image/webp"
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0]
							if (file) void handleAvatarFile(file)
							event.target.value = ""
						}}
					/>
					<button
						type="button"
						onClick={() => fileInputRef.current?.click()}
						className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)]"
					>
						{avatarPreview ? (
							// eslint-disable-next-line @next/next/no-img-element
							<img
								src={avatarPreview}
								alt="Avatar preview"
								className="h-full w-full object-cover"
							/>
						) : (
							<div className="flex h-full w-full items-center justify-center bg-[var(--color-ink-elevated)]">
								<UserRound className="h-8 w-8 text-[var(--color-text-muted)]" />
							</div>
						)}
						<span className="absolute bottom-0 right-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-signal)] text-[var(--color-ink)]">
							<Plus className="h-3.5 w-3.5" />
						</span>
					</button>
					<p className="mt-2 text-xs text-[var(--color-text-muted)]">
						Upload photo (optional)
					</p>
				</div>

				<div>
					<label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
						Username
					</label>
					<div
						className={cn(
							"flex items-center overflow-hidden rounded-lg border bg-[var(--color-ink-elevated)]",
							usernameStatus === "available"
								? "border-emerald-500/50"
								: usernameStatus === "taken" || usernameStatus === "invalid"
									? "border-red-500/50"
									: "border-[var(--color-border)]",
						)}
					>
						<span className="border-r border-[var(--color-border)] px-3 py-3 text-[var(--color-text-muted)]">
							@
						</span>
						<input
							value={username}
							onFocus={() => setIsUsernameFocused(true)}
							onBlur={() => setIsUsernameFocused(false)}
							onChange={(event) => setUsername(event.target.value)}
							placeholder="username"
							className="flex-1 bg-transparent px-3 py-3 text-sm text-[var(--color-text)] outline-none"
							maxLength={20}
							disabled={isLoading}
						/>
						<span className="px-3">
							{usernameStatus === "checking" ? (
								<Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
							) : null}
							{usernameStatus === "available" ? (
								<CheckCircle2 className="h-4 w-4 text-emerald-400" />
							) : null}
							{usernameStatus === "taken" || usernameStatus === "invalid" ? (
								<XCircle className="h-4 w-4 text-red-400" />
							) : null}
						</span>
					</div>
					{usernameStatus === "short" ? (
						<p className="mt-1 text-xs text-[var(--color-text-muted)]">Min 3 characters</p>
					) : null}
					{usernameStatus === "invalid" ? (
						<p className="mt-1 text-xs text-red-400">Letters, numbers, underscores only</p>
					) : null}
					{usernameStatus === "available" ? (
						<p className="mt-1 text-xs text-emerald-400">Available</p>
					) : null}
					{usernameStatus === "taken" ? (
						<p className="mt-1 text-xs text-red-400">Already taken</p>
					) : null}

					{isUsernameFocused ? (
						<div className="mt-2 flex flex-wrap gap-2">
							{usernameSuggestions.map((suggestion) => (
								<button
									key={suggestion}
									type="button"
									onClick={() => setUsername(suggestion)}
									className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
								>
									@{suggestion}
								</button>
							))}
						</div>
					) : null}
				</div>

				<AuthInput
					label="Email"
					value={email}
					onChange={setEmail}
					placeholder="you@email.com"
					type="email"
					icon={Mail}
					disabled={isLoading}
				/>

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
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
								className="text-[var(--color-text-muted)]"
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
							</button>
						}
					/>
					<PasswordStrength password={password} />
				</div>

				<AuthInput
					label="Confirm password"
					value={confirmPassword}
					onChange={setConfirmPassword}
					placeholder="Confirm password"
					type={showConfirmPassword ? "text" : "password"}
					icon={Lock}
					disabled={isLoading}
					success={passwordsMatch ? "Passwords match" : undefined}
					rightIcon={
						<button
							type="button"
							onClick={() => setShowConfirmPassword((prev) => !prev)}
							className="text-[var(--color-text-muted)]"
							aria-label={
								showConfirmPassword ? "Hide password" : "Show password"
							}
						>
							{showConfirmPassword ? (
								<EyeOff className="h-4 w-4" />
							) : (
								<Eye className="h-4 w-4" />
							)}
						</button>
					}
				/>
			</div>

			<button
				data-auth-bit
				type="button"
				onClick={handleSignup}
				disabled={isLoading}
				className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
			>
				{isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Sign up"}
			</button>

			{error ? (
				<div
					data-auth-bit
					className="flex items-center gap-2 text-sm text-red-400"
				>
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			) : null}
		</AuthShell>
	)
}

export default function SignupPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
					<LoadingSpinner />
				</div>
			}
		>
			<SignupPageInner />
		</Suspense>
	)
}
