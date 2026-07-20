"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useRef } from "react"

import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { AuthorReviewsList } from "@/components/reviews/AuthorReviewsList"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useFriends } from "@/hooks/useFriends"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function FriendProfilePage() {
	const params = useParams<{ userId: string }>()
	const userId = String(params.userId)
	const contentRef = useRef<HTMLDivElement>(null)

	const { sendRequest, friendRequests, acceptRequest, rejectRequest, removeFriend } =
		useFriends()
	const { data, isLoading, error } = trpc.friends.getFriendProfile.useQuery({ userId })
	const profileUserId = data?.user.id ?? userId

	useGSAP(
		() => {
			if (!contentRef.current || !data || prefersReducedMotion()) return
			gsap.fromTo(
				contentRef.current,
				{ opacity: 0, y: 12 },
				{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
			)
		},
		{ dependencies: [data?.user.id], scope: contentRef },
	)

	if (isLoading) {
		return (
			<AuthGuard>
				<div className="flex min-h-[60vh] items-center justify-center bg-[var(--color-ink)]">
					<LoadingSpinner />
				</div>
			</AuthGuard>
		)
	}

	if (error?.data?.code === "FORBIDDEN") {
		return (
			<AuthGuard>
				<div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center bg-[var(--color-ink)] px-6 text-center">
					<Lock className="h-8 w-8 text-[var(--color-text-muted)]" />
					<h1 className="mt-4 font-heading text-2xl font-bold text-[var(--color-text)]">
						Private profile
					</h1>
					<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
						Become friends to view more details.
					</p>
				</div>
			</AuthGuard>
		)
	}

	if (!data) return null

	const pendingRequest = friendRequests.find((request) => request.senderId === profileUserId)

	const actions = (
		<>
			{data.friendshipStatus === "none" ? (
				<button
					type="button"
					onClick={() => void sendRequest(profileUserId)}
					className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
				>
					Add friend
				</button>
			) : null}

			{data.friendshipStatus === "pending_sent" ? (
				<button
					type="button"
					disabled
					className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]"
				>
					Request sent
				</button>
			) : null}

			{data.friendshipStatus === "pending_received" ? (
				<>
					<button
						type="button"
						onClick={() => pendingRequest && void acceptRequest(pendingRequest.requestId)}
						className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
					>
						Accept
					</button>
					<button
						type="button"
						onClick={() => pendingRequest && void rejectRequest(pendingRequest.requestId)}
						className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)]"
					>
						Decline
					</button>
				</>
			) : null}

			{data.friendshipStatus === "friends" ? (
				<>
					<span className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)]">
						Friends
					</span>
					<button
						type="button"
						onClick={() => void removeFriend(profileUserId)}
						className="rounded-lg border border-red-400/40 px-4 py-2 text-sm text-red-300"
					>
						Remove
					</button>
				</>
			) : null}
		</>
	)

	return (
		<AuthGuard>
			<div className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10">
				<div ref={contentRef} className="mx-auto max-w-5xl space-y-10">
					<ProfileHeader
						user={{
							name: data.user.name,
							username: data.user.username,
							image: data.user.image,
							bio: data.user.bio,
						}}
						watchlistCount={data.stats.watchlistCount}
						ratingsCount={data.stats.ratingsCount}
						averageRating={Number(data.stats.avgRating) || 0}
						isOwnProfile={false}
						actions={actions}
					/>

					<section className="grid gap-8 lg:grid-cols-2">
						<div>
							<h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
								Recent watchlist
							</h2>
							{data.watchlist.length === 0 ? (
								<p className="text-sm text-[var(--color-text-muted)]">Nothing saved yet</p>
							) : (
								<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
									{data.watchlist
										.slice(0, 10)
										.map((item: { movieId: number; title: string; poster?: string | null }) => (
											<li key={item.movieId}>
												<Link
													href={`/movie/${item.movieId}`}
													className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-white/[0.02] hover:text-[var(--color-text)]"
												>
													{item.poster ? (
														<span className="relative h-12 w-8 flex-none overflow-hidden rounded bg-[var(--color-surface)]">
															<Image
																src={tmdb.getImageUrl(item.poster, "w200")}
																alt=""
																fill
																unoptimized
																sizes="32px"
																className="object-cover"
															/>
														</span>
													) : null}
													<span className="truncate">{item.title}</span>
												</Link>
											</li>
										))}
								</ul>
							)}
						</div>

						<div>
							<h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
								Recent ratings
							</h2>
							{data.ratings.length === 0 ? (
								<p className="text-sm text-[var(--color-text-muted)]">No ratings yet</p>
							) : (
								<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
									{data.ratings
										.slice(0, 10)
										.map(
											(rating: {
												movieId: number
												title: string
												rating: number
												review?: string | null
											}) => (
												<li key={rating.movieId}>
													<Link
														href={`/movie/${rating.movieId}`}
														className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]"
													>
														<span className="min-w-0">
															<span className="block truncate text-sm text-[var(--color-text-secondary)]">
																{rating.title}
															</span>
															{rating.review ? (
																<span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">
																	{rating.review}
																</span>
															) : null}
														</span>
														<span className="shrink-0 font-mono text-sm text-[var(--color-signal)]">
															{rating.rating}/10
														</span>
													</Link>
												</li>
											),
										)}
								</ul>
							)}
						</div>
					</section>

					<section>
						<h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">Reviews</h2>
						<AuthorReviewsList userId={profileUserId} />
					</section>
				</div>
			</div>
		</AuthGuard>
	)
}
