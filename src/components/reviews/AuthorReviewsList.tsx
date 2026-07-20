"use client"

import { ReviewCard } from "@/components/reviews/ReviewCard"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/lib/trpc/client"

type AuthorReviewsListProps = {
	userId: string
	emptyLabel?: string
}

export function AuthorReviewsList({
	userId,
	emptyLabel = "No written reviews yet",
}: AuthorReviewsListProps) {
	const { isAuthenticated } = useAuth()
	const { data = [], isLoading, error } = trpc.reviews.listForAuthor.useQuery(
		{ userId, limit: 12 },
		{ enabled: isAuthenticated && Boolean(userId) },
	)

	if (!isAuthenticated) {
		return (
			<p className="text-sm text-[var(--color-text-muted)]">Sign in to read reviews.</p>
		)
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-surface)]" />
				))}
			</div>
		)
	}

	if (error?.data?.code === "FORBIDDEN") {
		return (
			<p className="text-sm text-[var(--color-text-muted)]">Reviews are friends-only.</p>
		)
	}

	if (!data.length) {
		return <p className="text-sm text-[var(--color-text-muted)]">{emptyLabel}</p>
	}

	return (
		<div className="space-y-3">
			{data.map((review) => (
				<ReviewCard key={review.id} review={{ ...review, showMovieLink: true }} showMovieLink compact />
			))}
		</div>
	)
}
