"use client"

import { useMemo } from "react"
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"

import { useRatings } from "@/hooks/useRatings"
import { useWatchlist } from "@/hooks/useWatchlist"

export default function StatsTab() {
	const { ratings } = useRatings()
	const { watchlist } = useWatchlist()

	const histogram = useMemo(() => {
		const buckets = Array.from({ length: 10 }, (_, index) => ({
			score: String(index + 1),
			count: 0,
		}))

		for (const item of ratings) {
			const bucket = Math.min(10, Math.max(1, Math.round(item.rating))) - 1
			buckets[bucket].count += 1
		}

		return buckets
	}, [ratings])

	const totalRated = ratings.length
	const average = totalRated
		? ratings.reduce((sum, item) => sum + item.rating, 0) / totalRated
		: 0
	const peak = histogram.reduce(
		(best, row) => (row.count > best.count ? row : best),
		histogram[0],
	)

	return (
		<div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
			<section className="space-y-4">
				<div>
					<h2 className="text-sm font-semibold text-[var(--color-text)]">
						Rating distribution
					</h2>
					<p className="mt-1 text-sm text-[var(--color-text-muted)]">
						Count of films by score (1–10).
					</p>
				</div>

				<div className="h-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-3 py-4 sm:px-5">
					{totalRated > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={histogram}
								margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
								barCategoryGap="18%"
							>
								<CartesianGrid
									stroke="rgba(232,234,238,0.06)"
									vertical={false}
									strokeDasharray="0"
								/>
								<XAxis
									dataKey="score"
									tickLine={false}
									axisLine={false}
									tick={{ fill: "#8b93a7", fontSize: 12 }}
									dy={6}
								/>
								<YAxis
									allowDecimals={false}
									tickLine={false}
									axisLine={false}
									width={28}
									tick={{ fill: "#8b93a7", fontSize: 11 }}
								/>
								<Tooltip
									cursor={{ fill: "rgba(255,77,61,0.06)" }}
									formatter={(value) => {
										const count = Number(value ?? 0)
										return [`${count} film${count === 1 ? "" : "s"}`, "Rated"]
									}}
									labelFormatter={(label) => `Score ${label}`}
									contentStyle={{
										background: "#12151c",
										border: "1px solid rgba(232,234,238,0.1)",
										borderRadius: "8px",
										color: "#e8eaee",
										fontSize: "12px",
										boxShadow: "none",
									}}
									itemStyle={{ color: "#e8eaee" }}
									labelStyle={{ color: "#8b93a7", marginBottom: 4 }}
								/>
								<Bar
									dataKey="count"
									fill="var(--color-signal)"
									radius={[4, 4, 0, 0]}
									maxBarSize={36}
								/>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
							Rate films to see distribution
						</div>
					)}
				</div>

				{totalRated > 0 ? (
					<p className="text-xs text-[var(--color-text-muted)]">
						Most common score:{" "}
						<span className="text-[var(--color-text-secondary)]">
							{peak.score}/10 ({peak.count} film{peak.count === 1 ? "" : "s"})
						</span>
					</p>
				) : null}
			</section>

			<section className="space-y-3">
				<div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-5 py-5">
					<p className="text-xs text-[var(--color-text-muted)]">On watchlist</p>
					<p className="mt-2 font-heading text-4xl font-bold tabular-nums text-[var(--color-text)]">
						{watchlist.length}
					</p>
				</div>
				<div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-5 py-5">
					<p className="text-xs text-[var(--color-text-muted)]">Films rated</p>
					<p className="mt-2 font-heading text-4xl font-bold tabular-nums text-[var(--color-text)]">
						{totalRated}
					</p>
				</div>
				<div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-5 py-5">
					<p className="text-xs text-[var(--color-text-muted)]">Average score</p>
					<p className="mt-2 font-heading text-4xl font-bold tabular-nums text-[var(--color-signal)]">
						{average > 0 ? average.toFixed(1) : "—"}
						{average > 0 ? (
							<span className="text-lg font-medium text-[var(--color-text-muted)]">
								/10
							</span>
						) : null}
					</p>
				</div>
			</section>
		</div>
	)
}
