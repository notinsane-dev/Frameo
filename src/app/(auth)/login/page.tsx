"use client"

import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"

import { AuthDivider } from "@/components/auth/AuthDivider"
import { AuthInput } from "@/components/auth/AuthInput"
import { AuthShell } from "@/components/auth/AuthShell"
import { SocialAuthButton } from "@/components/auth/SocialAuthButton"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { resendVerification, signIn } from "@/lib/auth/auth-client"
import { safeNextPath } from "@/lib/share/safeNext"
import { stripAtSign } from "@/lib/utils/username"

function LoginPageInner() {
	const searchParams = useSearchParams()
	const nextPath = useMemo(
		() => safeNextPath(searchParams.get("next")),
		[searchParams],
	)
	const signupHref =
		nextPath !== "/"
			? `/signup?next=${encodeURIComponent(nextPath)}`
			: "/signup"

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
			const looksLikeEmail =
				normalizedIdentifier.includes("@") && normalizedIdentifier.includes(".")

			const result = looksLikeEmail
				? await signIn.email({
						email: normalizedIdentifier.toLowerCase(),
						password,
						callbackURL: nextPath,
					})
				: await signIn.username({
						username: stripAtSign(normalizedIdentifier).toLowerCase(),
						password,
						callbackURL: nextPath,
					})

			if (result.error) {
				if (result.error.message?.toLowerCase().includes("verify")) {
					setError("Please verify your email first.")
				} else {
					setError(result.error.message || "Invalid credentials")
				}
				return
			}

			window.location.replace(nextPath)
		} catch {
			setError("Unable to sign in right now. Please try again.")
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<AuthShell
			panelTitle="Decide what to watch next."
			panelSubtitle="Sign in to pick up your watchlist, ratings, and taste-matched recommendations."
			heading="Welcome back"
			subheading="Sign in to continue"
			footer={
				<>
					Don&apos;t have an account?{" "}
					<Link
						href={signupHref}
						className="font-medium text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
					>
						Sign up
					</Link>
				</>
			}
		>
			<div data-auth-bit>
				<SocialAuthButton
					provider="google"
					onClick={async () => {
						setIsLoading(true)
						setError("")
						await signIn.social({ provider: "google", callbackURL: nextPath })
					}}
					text="Continue with Google"
					isLoading={isLoading}
				/>
			</div>

			<div data-auth-bit>
				<AuthDivider text="or sign in with email" />
			</div>

			<div data-auth-bit className="space-y-4">
				<div>
					<AuthInput
						label="Email or username"
						value={identifier}
						onChange={setIdentifier}
						placeholder="you@email.com or @username"
						icon={User}
						disabled={isLoading}
					/>
					<p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
						Use your email or @username
					</p>
				</div>

				<AuthInput
					label="Password"
					value={password}
					onChange={setPassword}
					placeholder="Your password"
					type={showPassword ? "text" : "password"}
					icon={Lock}
					disabled={isLoading}
					rightIcon={
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					}
				/>
			</div>

			<div data-auth-bit className="flex justify-end">
				<Link
					href="/forgot-password"
					className="text-sm text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
				>
					Forgot password?
				</Link>
			</div>

			<button
				data-auth-bit
				type="button"
				onClick={handleLogin}
				disabled={isLoading}
				className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
			>
				{isLoading ? <LoadingSpinner size="sm" className="scale-75" /> : "Sign in"}
			</button>

			{error ? (
				<div
					data-auth-bit
					className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300"
				>
					<div className="flex items-center gap-2">
						<AlertCircle className="h-4 w-4 shrink-0" />
						<span>{error}</span>
					</div>
					{error.toLowerCase().includes("verify") ? (
						<button
							type="button"
							onClick={() => void resendVerification({ email: identifier })}
							className="mt-2 text-xs text-[var(--color-signal)]"
						>
							Resend verification email
						</button>
					) : null}
				</div>
			) : null}
		</AuthShell>
	)
}

export default function LoginPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
					<LoadingSpinner />
				</div>
			}
		>
			<LoginPageInner />
		</Suspense>
	)
}
