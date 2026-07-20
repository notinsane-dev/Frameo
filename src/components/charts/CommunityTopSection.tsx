"use client"

import { Film } from "lucide-react"

import { RankedMovieList } from "@/components/charts/RankedMovieList"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { trpc } from "@/lib/trpc/client"

import type { ChartsPeriod } from "./ChartsPeriodTabs"

type CommunityTopSectionProps = {
	period: ChartsPeriod
}

function toMovie(item: {
	movieId: number
	title: string
	poster: string | null
	avgRating: number
}): TMDBMovie {
	return {
		id: item.movieId,
		title: item.title,
		overview: "",
		poster_path: item.poster,
		backdrop_path: null,
		release_date: "",
		vote_average: item.avgRating,
		genre_ids: [],
	}
}

export function CommunityTopSection({ period }: CommunityTopSectionProps) {
	const { data, isLoading, isError } = trpc.movies.getCommunityTop.useQuery({ period })

	const periodLabel = period === "month" ? "this month" : "this year"

	return (
		<section className="mt-16 border-t border-[var(--color-border)] pt-12">
			<p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]">
				Frameo community
			</p>
			<h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
				Top 10 rated {periodLabel}
			</h2>
			<p className="mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
				Ranked by how often Frameo users rated them, then by average score.
			</p>

			<div className="mt-8">
				{isLoading ? (
					<div className="flex justify-center py-16">
						<LoadingSpinner />
					</div>
				) : isError ? (
					<div className="rounded-2xl border border-[var(--color-border)] px-6 py-12 text-center">
						<p className="text-sm text-[var(--color-text-secondary)]">
							Couldn’t load community charts right now.
						</p>
					</div>
				) : !data || data.length === 0 ? (
					<div className="rounded-2xl border border-[var(--color-border)] px-6 py-12 text-center">
						<Film className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
						<p className="mt-3 text-sm text-[var(--color-text-secondary)]">
							Be the first to rate {periodLabel}.
						</p>
					</div>
				) : (
					<RankedMovieList
						movies={data.map(toMovie)}
						meta={(movie) => {
							const item = data.find((row) => row.movieId === movie.id)
							if (!item) return null
							return (
								<span>
									{item.avgRating.toFixed(1)} avg · {item.ratingCount} ratings
								</span>
							)
						}}
					/>
				)}
			</div>
		</section>
	)
}
