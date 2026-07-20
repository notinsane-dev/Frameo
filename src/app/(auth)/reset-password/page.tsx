"use client"

import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

import { AuthInput } from "@/components/auth/AuthInput"
import { AuthCardShell } from "@/components/auth/AuthShell"
import { PasswordStrength } from "@/components/auth/PasswordStrength"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { resetPassword } from "@/lib/auth/auth-client"

function ResetPasswordForm() {
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
			<AuthCardShell>
				<div data-auth-bit className="text-center">
					<AlertCircle className="mx-auto h-10 w-10 text-red-400" />
					<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
						Link invalid or expired
					</h1>
					<Link
						href="/forgot-password"
						className="mt-5 inline-block text-sm text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
					>
						Request a new one
					</Link>
				</div>
			</AuthCardShell>
		)
	}

	if (isSuccess) {
		return (
			<AuthCardShell>
				<div data-auth-bit className="text-center">
					<CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
					<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
						Password updated
					</h1>
					<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
						You can now sign in with your new password
					</p>
					<Link
						href="/login"
						className="mt-6 inline-block rounded-lg bg-[var(--color-signal)] px-5 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
					>
						Sign in
					</Link>
				</div>
			</AuthCardShell>
		)
	}

	return (
		<AuthCardShell>
			<div
				data-auth-bit
				className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
			>
				<Lock className="h-6 w-6" />
			</div>

			<h1
				data-auth-bit
				className="mt-5 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
			>
				Set new password
			</h1>
			<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
				Enter your new password below
			</p>

			<div data-auth-bit className="mt-6 space-y-4">
				<div className="space-y-2">
					<AuthInput
						label="New password"
						value={password}
						onChange={setPassword}
						placeholder="New password"
						type={showPassword ? "text" : "password"}
						icon={Lock}
						rightIcon={
							<button
								type="button"
								onClick={() => setShowPassword((prev) => !prev)}
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
					rightIcon={
						<button
							type="button"
							onClick={() => setShowConfirmPassword((prev) => !prev)}
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

				<button
					type="button"
					onClick={submit}
					disabled={isLoading}
					className="inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
				>
					{isLoading ? (
						<LoadingSpinner size="sm" className="scale-75" />
					) : (
						"Update password"
					)}
				</button>
			</div>

			{error ? (
				<p data-auth-bit className="mt-3 text-sm text-red-400">
					{error}
				</p>
			) : null}
		</AuthCardShell>
	)
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
					<LoadingSpinner />
				</div>
			}
		>
			<ResetPasswordForm />
		</Suspense>
	)
}
