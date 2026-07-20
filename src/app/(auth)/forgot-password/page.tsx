"use client"

import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { AuthInput } from "@/components/auth/AuthInput"
import { AuthCardShell } from "@/components/auth/AuthShell"
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
		<AuthCardShell>
			<div data-auth-bit>
				<Link
					href="/login"
					className="inline-flex items-center gap-1 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Link>
			</div>

			{!isSubmitted ? (
				<>
					<div
						data-auth-bit
						className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
					>
						<KeyRound className="h-6 w-6" />
					</div>
					<h1
						data-auth-bit
						className="mt-5 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
					>
						Forgot your password?
					</h1>
					<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
						Enter your email and we&apos;ll send you a reset link
					</p>

					<div data-auth-bit className="mt-6 space-y-4">
						<AuthInput
							label="Email"
							value={email}
							onChange={setEmail}
							placeholder="you@example.com"
							disabled={isLoading}
						/>

						<button
							type="button"
							onClick={sendReset}
							disabled={isLoading}
							className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
						>
							{isLoading ? (
								<LoadingSpinner size="sm" className="scale-75" />
							) : (
								"Send reset link"
							)}
						</button>
					</div>

					{error ? (
						<p data-auth-bit className="mt-3 text-sm text-red-400">
							{error}
						</p>
					) : null}
				</>
			) : (
				<>
					<div
						data-auth-bit
						className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"
					>
						<CheckCircle2 className="h-6 w-6" />
					</div>
					<h1
						data-auth-bit
						className="mt-5 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
					>
						Reset link sent
					</h1>
					<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
						Check your email for the password reset link. It expires in 1 hour.
					</p>

					<button
						data-auth-bit
						type="button"
						onClick={sendReset}
						disabled={resendCooldown > 0}
						className="mt-6 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] disabled:opacity-60"
					>
						{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
					</button>

					<div data-auth-bit className="mt-4">
						<Link
							href="/login"
							className="text-sm text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
						>
							Back to login
						</Link>
					</div>
				</>
			)}
		</AuthCardShell>
	)
}
