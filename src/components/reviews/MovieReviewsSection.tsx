"use client"

import { useState } from "react"

import { ReviewCard } from "@/components/reviews/ReviewCard"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc/client"

type MovieReviewsSectionProps = {
	movieId: number
}

export function MovieReviewsSection({ movieId }: MovieReviewsSectionProps) {
	const { isAuthenticated } = useAuth()
	const [tab, setTab] = useState<"community" | "taste">("community")

	const community = trpc.reviews.listForMovie.useQuery(
		{ movieId, limit: 20 },
		{ enabled: isAuthenticated },
	)
	const taste = trpc.reviews.listTasteMatched.useQuery(
		{ movieId, limit: 8 },
		{ enabled: isAuthenticated && tab === "taste" },
	)

	const items = tab === "community" ? community.data?.items ?? [] : taste.data?.items ?? []
	const loading = tab === "community" ? community.isLoading : taste.isLoading
	const message =
		tab === "taste" ? taste.data?.message : items.length === 0 ? "No community reviews yet." : null

	return (
		<section id="reviews" className="scroll-mt-24 space-y-6 border-t border-[var(--color-border)] pt-14">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
						Reviews
					</p>
					<h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
						What people are saying
					</h2>
				</div>
				<div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
					<button
						type="button"
						onClick={() => setTab("community")}
						className={
							tab === "community"
								? "rounded-md bg-[var(--color-signal)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
								: "rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
						}
					>
						Community
					</button>
					<button
						type="button"
						onClick={() => setTab("taste")}
						className={
							tab === "taste"
								? "rounded-md bg-[var(--color-signal)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)]"
								: "rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
						}
					>
						For your taste
					</button>
				</div>
			</div>

			{!isAuthenticated ? (
				<p className="text-sm text-[var(--color-text-secondary)]">
					Sign in to read community reviews, agree/disagree, and join the conversation.
				</p>
			) : loading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="h-28 animate-pulse rounded-xl bg-[var(--color-surface)]"
						/>
					))}
				</div>
			) : items.length === 0 ? (
				<p className="text-sm text-[var(--color-text-muted)]">
					{message || "No reviews yet for this title."}
				</p>
			) : (
				<div className="space-y-4">
					{items.map((item) => (
						<ReviewCard key={item.id} review={item} />
					))}
				</div>
			)}
		</section>
	)
}
