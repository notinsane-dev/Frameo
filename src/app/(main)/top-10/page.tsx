"use client"

import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useCallback, useMemo } from "react"

import { ChartsCategoryPills, type ChartsCategory } from "@/components/charts/ChartsCategoryPills"
import { ChartsPeriodTabs, type ChartsPeriod } from "@/components/charts/ChartsPeriodTabs"
import { CommunityTopSection } from "@/components/charts/CommunityTopSection"
import { RankedActorList } from "@/components/charts/RankedActorList"
import { RankedMovieList } from "@/components/charts/RankedMovieList"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { trpc } from "@/lib/trpc/client"

const expoOut = [0.16, 1, 0.3, 1] as const

function parsePeriod(value: string | null): ChartsPeriod {
	return value === "year" ? "year" : "month"
}

function parseCategory(value: string | null): ChartsCategory {
	return value === "actors" ? "actors" : "movies"
}

function ChartsPageContent() {
	const router = useRouter()
	const searchParams = useSearchParams()

	const period = parsePeriod(searchParams.get("period"))
	const category = parseCategory(searchParams.get("category"))

	const chartsQuery = trpc.movies.getCharts.useQuery({ period, category })

	const periodLabel = period === "month" ? "month" : "year"
	const now = useMemo(() => new Date(), [])
	const rangeLabel =
		period === "month"
			? now.toLocaleString("en-US", { month: "long", year: "numeric" })
			: String(now.getFullYear())

	const updateParams = useCallback(
		(next: { period?: ChartsPeriod; category?: ChartsCategory }) => {
			const params = new URLSearchParams(searchParams.toString())
			const nextPeriod = next.period ?? period
			const nextCategory = next.category ?? category

			if (nextPeriod === "month") params.delete("period")
			else params.set("period", nextPeriod)

			if (nextCategory === "movies") params.delete("category")
			else params.set("category", nextCategory)

			const query = params.toString()
			router.replace(query ? `/top-10?${query}` : "/top-10", { scroll: false })
		},
		[category, period, router, searchParams],
	)

	return (
		<div className="min-h-[100dvh] bg-[var(--color-ink)]">
			<section className="relative overflow-hidden border-b border-[var(--color-border)] px-6 pb-10 pt-10 md:px-12 md:pb-14 md:pt-14">
				<div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[var(--color-signal)]/10 blur-3xl" />
				<div className="relative mx-auto max-w-7xl">
					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: expoOut }}
						className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]"
					>
						Charts
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.05, ease: expoOut }}
						className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-6xl"
					>
						Top 10 of the {periodLabel}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.1, ease: expoOut }}
						className="mt-3 max-w-xl text-base text-[var(--color-text-secondary)] md:text-lg"
					>
						Industry buzz from TMDB for {rangeLabel}, plus what Frameo users are rating.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.16, ease: expoOut }}
						className="mt-8"
					>
						<ChartsPeriodTabs
							value={period}
							onChange={(next) => updateParams({ period: next })}
						/>
					</motion.div>
				</div>
			</section>

			<div className="mx-auto max-w-7xl px-6 py-10 md:px-12 md:py-14">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]">
							TMDB
						</p>
						<h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
							{category === "movies" ? "Top movies" : "Top actors"}
						</h2>
					</div>
					<ChartsCategoryPills
						value={category}
						onChange={(next) => updateParams({ category: next })}
					/>
				</div>

				{chartsQuery.isLoading ? (
					<div className="flex justify-center py-20">
						<LoadingSpinner />
					</div>
				) : chartsQuery.isError ? (
					<div className="rounded-2xl border border-[var(--color-border)] px-6 py-12 text-center">
						<p className="text-sm text-[var(--color-text-secondary)]">
							Couldn’t load TMDB charts right now.
						</p>
					</div>
				) : chartsQuery.data?.category === "actors" ? (
					<RankedActorList actors={chartsQuery.data.actors} />
				) : (
					<RankedMovieList movies={chartsQuery.data?.movies ?? []} />
				)}

				<CommunityTopSection period={period} />
			</div>
		</div>
	)
}

export default function Top10Page() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-[60dvh] items-center justify-center bg-[var(--color-ink)]">
					<LoadingSpinner />
				</div>
			}
		>
			<ChartsPageContent />
		</Suspense>
	)
}
