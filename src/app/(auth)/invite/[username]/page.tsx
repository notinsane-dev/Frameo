"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"

import { AuthCardShell } from "@/components/auth/AuthShell"
import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useAuth } from "@/hooks/useAuth"
import { useClaimInvite } from "@/hooks/useClaimInvite"
import { writeInviteRef } from "@/lib/share/inviteCookie"
import { trpc } from "@/lib/trpc/client"
import { siteConfig } from "@/config/site"

export default function InvitePage() {
	const params = useParams<{ username: string }>()
	const username = decodeURIComponent(params.username || "").trim().toLowerCase()
	const router = useRouter()
	const { isAuthenticated, isLoading: authLoading, hasUsername } = useAuth()
	const { claimPendingInvite, isClaiming } = useClaimInvite()

	const { data, isLoading } = trpc.friends.getInvitePreview.useQuery(
		{ username },
		{ enabled: username.length >= 3 },
	)

	useEffect(() => {
		if (username.length >= 3) writeInviteRef(username)
	}, [username])

	useEffect(() => {
		if (authLoading || !isAuthenticated) return
		if (!hasUsername) {
			router.replace("/setup-username")
			return
		}
		void claimPendingInvite()
	}, [authLoading, isAuthenticated, hasUsername, claimPendingInvite, router])

	if (isLoading || authLoading || (isAuthenticated && isClaiming)) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
				<LoadingSpinner />
			</div>
		)
	}

	if (!data?.available || !data.inviter) {
		return (
			<AuthCardShell>
				<div data-auth-bit>
					<FrameoLogo />
				</div>
				<h1
					data-auth-bit
					className="mt-6 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
				>
					Invite unavailable
				</h1>
				<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
					This invite link is invalid or the profile is private.
				</p>
				<div data-auth-bit className="mt-6 flex flex-col gap-2">
					<Link
						href="/signup"
						className="inline-flex items-center justify-center rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
					>
						Join {siteConfig.name}
					</Link>
					<Link
						href="/login"
						className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
					>
						I already have an account
					</Link>
				</div>
			</AuthCardShell>
		)
	}

	const inviter = data.inviter

	return (
		<AuthCardShell>
			<div data-auth-bit>
				<FrameoLogo />
			</div>
			<p data-auth-bit className="mt-6 text-xs font-medium text-[var(--color-signal)]">
				You&apos;re invited
			</p>
			<h1
				data-auth-bit
				className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
			>
				Join {siteConfig.name}
			</h1>
			<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
				{inviter.name} wants to connect and compare taste with you.
			</p>

			<div
				data-auth-bit
				className="mt-6 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-4"
			>
				<AvatarUpload
					currentImage={inviter.image}
					name={inviter.name}
					size="lg"
					editable={false}
				/>
				<div className="min-w-0">
					<p className="truncate font-heading text-lg font-semibold text-[var(--color-text)]">
						{inviter.name}
					</p>
					<p className="text-sm text-[var(--color-text-muted)]">@{inviter.username}</p>
				</div>
			</div>

			<div data-auth-bit className="mt-6 flex flex-col gap-2">
				<Link
					href={`/signup?ref=${encodeURIComponent(inviter.username)}`}
					className="inline-flex items-center justify-center rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
				>
					Join {siteConfig.name}
				</Link>
				<Link
					href={`/login?next=${encodeURIComponent(`/profile/${inviter.id}`)}`}
					className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
				>
					I already have an account
				</Link>
			</div>
		</AuthCardShell>
	)
}
