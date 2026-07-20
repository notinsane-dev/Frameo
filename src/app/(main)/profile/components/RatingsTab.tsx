"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"
import { useRef } from "react"

import { AuthorReviewsList } from "@/components/reviews/AuthorReviewsList"
import { useAuth } from "@/hooks/useAuth"
import { useRatings } from "@/hooks/useRatings"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function RatingsTab() {
	const { user } = useAuth()
	const { ratings, isLoading } = useRatings()
	const listRef = useRef<HTMLUListElement>(null)

	useGSAP(
		() => {
			if (!listRef.current || isLoading || prefersReducedMotion()) return
			const rows = listRef.current.querySelectorAll("[data-rating-row]")
			const meters = listRef.current.querySelectorAll<HTMLElement>("[data-meter]")
			if (!rows.length) return

			gsap.fromTo(
				rows,
				{ opacity: 0, y: 12 },
				{ opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" },
			)

			meters.forEach((meter) => {
				const percent = Number(meter.dataset.percent || 0)
				gsap.fromTo(
					meter,
					{ width: 0 },
					{ width: `${percent}%`, duration: 0.7, ease: "power2.out", delay: 0.1 },
				)
			})
		},
		{ dependencies: [isLoading, ratings.length], scope: listRef },
	)

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="h-16 animate-pulse rounded-lg bg-[var(--color-surface)]"
					/>
				))}
			</div>
		)
	}

	if (!ratings.length) {
		return (
			<div className="max-w-md py-10">
				<p className="text-sm font-semibold text-[var(--color-text)]">No ratings yet</p>
				<p className="mt-1 text-sm text-[var(--color-text-muted)]">
					Rate a film from its page to start building your taste map.
				</p>
			</div>
		)
	}

	return (
		<div className="space-y-10">
			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-[var(--color-text)]">Written reviews</h3>
				{user?.id ? (
					<AuthorReviewsList userId={user.id} emptyLabel="You haven't written a review yet." />
				) : null}
			</section>

			<section className="space-y-3">
				<h3 className="text-sm font-semibold text-[var(--color-text)]">All scores</h3>
				<ul
					ref={listRef}
					className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]"
				>
					{ratings.map((rating) => {
						const percent = Math.max(0, Math.min(100, (rating.rating / 10) * 100))
						return (
							<li key={rating.movieId} data-rating-row className="px-4 py-3.5">
								<div className="flex items-start justify-between gap-4">
									<div className="min-w-0">
										<Link
											href={`/movie/${rating.movieId}`}
											className="text-sm font-medium text-[var(--color-text)] transition-colors hover:text-[var(--color-signal)]"
										>
											{rating.title}
										</Link>
										<p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
											{rating.review || "No review"}
										</p>
									</div>
									<p className="shrink-0 font-heading text-xl font-bold tabular-nums text-[var(--color-signal)]">
										{rating.rating.toFixed(1)}
										<span className="text-sm font-medium text-[var(--color-text-muted)]">
											/10
										</span>
									</p>
								</div>
								<div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
									<div
										data-meter
										data-percent={percent}
										className="h-full rounded-full bg-[var(--color-signal)]"
										style={{ width: prefersReducedMotion() ? `${percent}%` : 0 }}
									/>
								</div>
							</li>
						)
					})}
				</ul>
			</section>
		</div>
	)
}
