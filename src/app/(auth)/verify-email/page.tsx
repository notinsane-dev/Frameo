"use client"

import { AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { AuthCardShell } from "@/components/auth/AuthShell"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useAuth } from "@/hooks/useAuth"
import { siteConfig } from "@/config/site"

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
			<div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-ink)]">
				<LoadingSpinner />
				<p className="text-sm text-[var(--color-text-secondary)]">
					Verifying your email...
				</p>
			</div>
		)
	}

	if (isAuthenticated && isEmailVerified) {
		return (
			<AuthCardShell>
				<div data-auth-bit className="text-center">
					<CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
					<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
						Email verified
					</h1>
					<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
						Welcome to {siteConfig.name}
						{user?.name ? `, ${user.name}` : ""}
					</p>
				</div>
			</AuthCardShell>
		)
	}

	return (
		<AuthCardShell>
			<div data-auth-bit className="text-center">
				<AlertCircle className="mx-auto h-10 w-10 text-red-400" />
				<h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
					Verification failed
				</h1>
				<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
					This link may have expired.
				</p>
				<Link
					href="/signup"
					className="mt-5 inline-block text-sm text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
				>
					Request new link
				</Link>
			</div>
		</AuthCardShell>
	)
}
