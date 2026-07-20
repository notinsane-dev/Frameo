"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"
import { Users } from "lucide-react"
import { useRef } from "react"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useToastContext } from "@/components/shared/ToastProvider"
import { trpc } from "@/lib/trpc/client"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function TasteTwinsPage() {
	const pageRef = useRef<HTMLDivElement>(null)
	const { data, isLoading, isError, error, refetch, isFetching } =
		trpc.taste.getTwins.useQuery({ limit: 10 })
	const { showToast } = useToastContext()
	const utils = trpc.useUtils()
	const sendRequest = trpc.friends.sendFriendRequest.useMutation({
		onSuccess: async () => {
			showToast("Friend request sent", "success")
			await utils.taste.getTwins.invalidate()
		},
		onError: (err) => showToast(err.message, "error"),
	})

	const twins = data?.twins ?? []
	const emptyMessage =
		data?.message ??
		"No taste twins yet. Rate more movies, or check back as more people build profiles."

	useGSAP(
		() => {
			const root = pageRef.current
			if (!root || prefersReducedMotion() || isLoading) return

			const bits = root.querySelectorAll("[data-twin-bit]")
			gsap.from(bits, {
				opacity: 0,
				y: 14,
				duration: 0.4,
				stagger: 0.05,
				ease: "power2.out",
			})
		},
		{ scope: pageRef, dependencies: [isLoading, twins.length, isError] },
	)

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10"
			>
				<section className="mx-auto mb-10 max-w-3xl">
					<p
						data-twin-bit
						className="text-xs font-medium text-[var(--color-signal)]"
					>
						Social
					</p>
					<div data-twin-bit className="mt-3 flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-signal-muted)] text-[var(--color-signal)]">
							<Users className="h-5 w-5" />
						</div>
						<h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
							Taste Twins
						</h1>
					</div>
					<p
						data-twin-bit
						className="mt-3 max-w-xl text-sm text-[var(--color-text-secondary)]"
					>
						People whose taste embedding is closest to yours — not just popular lists.
					</p>
				</section>

				<div className="mx-auto max-w-3xl space-y-4">
					{isLoading || (isFetching && twins.length === 0) ? (
						<div className="flex justify-center py-16">
							<LoadingSpinner />
						</div>
					) : null}

					{isError ? (
						<div
							data-twin-bit
							className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-6 text-center"
						>
							<p className="text-sm text-red-300">
								{error.message || "Couldn’t load taste twins."}
							</p>
							<button
								type="button"
								onClick={() => void refetch()}
								className="mt-4 rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
							>
								Try again
							</button>
						</div>
					) : null}

					{!isLoading && !isError && twins.length === 0 ? (
						<div
							data-twin-bit
							className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-5 py-10 text-center"
						>
							<p className="text-sm text-[var(--color-text-secondary)]">{emptyMessage}</p>
							<div className="mt-5 flex flex-wrap items-center justify-center gap-3">
								<Link
									href="/explore"
									className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
								>
									Explore movies
								</Link>
								<Link
									href="/recommendations"
									className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
								>
									Get recommendations
								</Link>
							</div>
						</div>
					) : null}

					{twins.map((twin) => (
						<article
							key={twin.id}
							data-twin-bit
							className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-5"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="min-w-0">
									<Link
										href={`/profile/${twin.id}`}
										className="font-heading text-xl font-semibold tracking-tight text-[var(--color-text)] transition-colors hover:text-[var(--color-signal)]"
									>
										{twin.name}
									</Link>
									{twin.username ? (
										<p className="text-sm text-[var(--color-text-muted)]">
											@{twin.username}
										</p>
									) : null}
									<p className="mt-2 text-sm text-[var(--color-signal)]">
										{Math.round(twin.similarity * 100)}% taste match ·{" "}
										{twin.overlapCount} shared favorites
									</p>
									<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
										{twin.whyMatch}
									</p>
									{twin.overlapTitles.length > 0 ? (
										<p className="mt-2 text-xs text-[var(--color-text-muted)]">
											Overlap: {twin.overlapTitles.join(", ")}
										</p>
									) : null}
									{twin.theirPicks.length > 0 ? (
										<p className="mt-1 text-xs text-[var(--color-text-muted)]">
											Try from them: {twin.theirPicks.join(", ")}
										</p>
									) : null}
								</div>
								{twin.isFriend ? (
									<span className="shrink-0 rounded-md border border-emerald-400/30 px-3 py-1 text-xs text-emerald-300">
										Friends
									</span>
								) : (
									<button
										type="button"
										disabled={sendRequest.isPending}
										onClick={() => sendRequest.mutate({ receiverId: twin.id })}
										className="shrink-0 rounded-lg bg-[var(--color-signal)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
									>
										Add friend
									</button>
								)}
							</div>
						</article>
					))}
				</div>
			</div>
		</AuthGuard>
	)
}
