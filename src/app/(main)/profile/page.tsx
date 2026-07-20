"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import dynamic from "next/dynamic"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef, useState } from "react"

import { RatingsTab } from "@/app/(main)/profile/components/RatingsTab"
import { WatchlistTab } from "@/app/(main)/profile/components/WatchlistTab"
import { EditProfileModal } from "@/components/profile/EditProfileModal"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { ShareActions } from "@/components/share/ShareActions"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { useAuth } from "@/hooks/useAuth"
import { useRatings } from "@/hooks/useRatings"
import { useWatchlist } from "@/hooks/useWatchlist"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

const StatsTab = dynamic(() => import("@/app/(main)/profile/components/StatsTab"), {
	ssr: false,
})

const tabs = [
	{ id: "watchlist", label: "Watchlist" },
	{ id: "ratings", label: "Ratings" },
	{ id: "stats", label: "Stats" },
] as const

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function ProfilePage() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const activeTab = searchParams.get("tab") || "watchlist"
	const { user } = useAuth()
	const utils = trpc.useUtils()
	const { watchlist } = useWatchlist()
	const { ratings } = useRatings()
	const { data: profile } = trpc.user.getProfile.useQuery()
	const [isEditing, setIsEditing] = useState(false)

	const pageRef = useRef<HTMLDivElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	const averageRating = ratings.length
		? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
		: 0

	useGSAP(
		() => {
			if (!panelRef.current || prefersReducedMotion()) return
			gsap.fromTo(
				panelRef.current,
				{ opacity: 0, y: 10 },
				{ opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
			)
		},
		{ dependencies: [activeTab], scope: pageRef },
	)

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10"
			>
				<div className="mx-auto max-w-5xl space-y-8">
					<ProfileHeader
						user={{
							name: profile?.name || user?.name,
							username: profile?.username || user?.username,
							image: profile?.image || user?.image,
							email: profile?.email || user?.email,
							bio: profile?.bio,
						}}
						watchlistCount={watchlist.length}
						ratingsCount={ratings.length}
						averageRating={averageRating}
						isOwnProfile
						onAvatarUpload={() => {
							void utils.user.getProfile.invalidate()
						}}
						actions={
							<div className="flex flex-wrap items-center gap-2">
								{user?.id ? (
									<ShareActions
										userId={user.id}
										username={profile?.username || user.username}
										name={profile?.name || user.name}
									/>
								) : null}
								<button
									type="button"
									onClick={() => setIsEditing(true)}
									className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
								>
									Edit profile
								</button>
							</div>
						}
					/>

					<EditProfileModal
						isOpen={isEditing}
						onClose={() => setIsEditing(false)}
						user={{
							name: profile?.name,
							username: profile?.username,
							image: profile?.image,
							bio: profile?.bio,
							isPublic: profile?.isPublic,
							streamingServices: profile?.streamingServices,
						}}
					/>

					<nav
						className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]"
						aria-label="Profile sections"
					>
						{tabs.map((tab) => {
							const active = activeTab === tab.id
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => router.push(`/profile?tab=${tab.id}`)}
									className={cn(
										"relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
										active
											? "text-[var(--color-text)]"
											: "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
									)}
								>
									{tab.label}
									{active ? (
										<span className="absolute inset-x-4 bottom-0 h-0.5 bg-[var(--color-signal)]" />
									) : null}
								</button>
							)
						})}
					</nav>

					<div ref={panelRef}>
						{activeTab === "ratings" ? <RatingsTab /> : null}
						{activeTab === "stats" ? <StatsTab /> : null}
						{activeTab === "watchlist" ? <WatchlistTab /> : null}
					</div>
				</div>
			</div>
		</AuthGuard>
	)
}
