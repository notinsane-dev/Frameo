"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRef, type ReactNode } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { useCountUp } from "@/hooks/useGSAPAnimations"

gsap.registerPlugin(useGSAP)

type ProfileUser = {
	name?: string | null
	username?: string | null
	image?: string | null
	email?: string | null
	bio?: string | null
} | null

type ProfileHeaderProps = {
	user: ProfileUser
	watchlistCount: number
	ratingsCount: number
	averageRating: number
	isOwnProfile?: boolean
	onAvatarUpload?: (url: string) => void
	actions?: ReactNode
}

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function StatValue({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement | null>(null)
	useCountUp(ref, value)
	return <span ref={ref} className="font-heading text-2xl font-bold tabular-nums text-[var(--color-text)]" />
}

export function ProfileHeader({
	user,
	watchlistCount,
	ratingsCount,
	averageRating,
	isOwnProfile = true,
	onAvatarUpload,
	actions,
}: ProfileHeaderProps) {
	const rootRef = useRef<HTMLElement>(null)

	useGSAP(
		() => {
			if (!rootRef.current || prefersReducedMotion()) return
			const bits = rootRef.current.querySelectorAll("[data-profile-bit]")
			gsap.fromTo(
				bits,
				{ opacity: 0, y: 14 },
				{ opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" },
			)
		},
		{ scope: rootRef },
	)

	return (
		<header
			ref={rootRef}
			className="relative overflow-hidden border-b border-[var(--color-border)] pb-8"
		>
			<div
				aria-hidden
				className="pointer-events-none absolute -left-20 top-0 h-48 w-48 rounded-full bg-[var(--color-signal)]/10 blur-3xl"
			/>

			<div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex items-start gap-5" data-profile-bit>
					<AvatarUpload
						currentImage={user?.image}
						name={user?.name || "Movie Lover"}
						size="xl"
						editable={isOwnProfile}
						onUpload={onAvatarUpload}
					/>
					<div className="min-w-0 pt-1">
						<p className="text-xs font-medium text-[var(--color-text-muted)]">
							{isOwnProfile ? "Your profile" : "Profile"}
						</p>
						<h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] text-balance md:text-4xl">
							{user?.name || "Movie Lover"}
						</h1>
						<p className="mt-1 text-sm text-[var(--color-signal)]">
							@{user?.username || "user"}
						</p>
						{user?.bio ? (
							<p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
								{user.bio}
							</p>
						) : isOwnProfile ? (
							<p className="mt-3 max-w-md text-sm text-[var(--color-text-muted)]">
								Add a bio from Edit profile.
							</p>
						) : null}
						{actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
					</div>
				</div>

				<dl
					data-profile-bit
					className="grid grid-cols-3 gap-6 sm:gap-10 lg:text-right"
				>
					<div>
						<dt className="text-xs text-[var(--color-text-muted)]">Watchlist</dt>
						<dd className="mt-1">
							<StatValue value={watchlistCount} />
						</dd>
					</div>
					<div>
						<dt className="text-xs text-[var(--color-text-muted)]">Ratings</dt>
						<dd className="mt-1">
							<StatValue value={ratingsCount} />
						</dd>
					</div>
					<div>
						<dt className="text-xs text-[var(--color-text-muted)]">Avg score</dt>
						<dd className="mt-1 font-heading text-2xl font-bold tabular-nums text-[var(--color-text)]">
							{averageRating > 0 ? averageRating.toFixed(1) : "—"}
						</dd>
					</div>
				</dl>
			</div>
		</header>
	)
}
