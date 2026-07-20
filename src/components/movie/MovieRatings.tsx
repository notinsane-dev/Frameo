"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useRef } from "react"

import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import type { ExternalRatings } from "@/lib/omdb/client"

type MovieRatingsProps = {
	tmdbScore: number
	tmdbVotes?: number
	external: ExternalRatings
}

type SourceRow = {
	key: string
	label: string
	display: string
	/** 0–100 for the meter */
	percent: number
	tone: string
	sub?: string
}

function clampPercent(n: number) {
	return Math.max(0, Math.min(100, n))
}

function buildSources(
	tmdbScore: number,
	tmdbVotes: number | undefined,
	external: ExternalRatings,
): { primary: SourceRow; others: SourceRow[] } {
	const primary: SourceRow = {
		key: "tmdb",
		label: "TMDB",
		display: tmdbScore > 0 ? tmdbScore.toFixed(1) : "—",
		percent: clampPercent(tmdbScore * 10),
		tone: "var(--color-signal)",
		sub: tmdbVotes ? `${tmdbVotes.toLocaleString()} votes` : undefined,
	}

	const others: SourceRow[] = []

	if (external.imdb?.score != null) {
		others.push({
			key: "imdb",
			label: "IMDb",
			display: external.imdb.score.toFixed(1),
			percent: clampPercent(external.imdb.score * 10),
			tone: "#F5C518",
			sub: "/10",
		})
	}

	if (external.rottenTomatoes?.score != null) {
		others.push({
			key: "rt",
			label: "Rotten Tomatoes",
			display: `${Math.round(external.rottenTomatoes.score)}%`,
			percent: clampPercent(external.rottenTomatoes.score),
			tone: "#FA320A",
			sub: "Tomatometer",
		})
	}

	if (external.metacritic?.score != null) {
		others.push({
			key: "metacritic",
			label: "Metacritic",
			display: String(Math.round(external.metacritic.score)),
			percent: clampPercent(external.metacritic.score),
			tone: "#66CC33",
			sub: "/100",
		})
	}

	return { primary, others }
}

function Meter({
	percent,
	tone,
	delay = 0,
}: {
	percent: number
	tone: string
	delay?: number
}) {
	const reduceMotion = useReducedMotion()

	return (
		<div
			className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
			role="meter"
			aria-valuenow={Math.round(percent)}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<motion.div
				className="h-full rounded-full"
				style={{ backgroundColor: tone }}
				initial={reduceMotion ? false : { width: 0 }}
				whileInView={{ width: `${percent}%` }}
				viewport={{ once: true, amount: 0.6 }}
				transition={{
					duration: reduceMotion ? 0 : 0.9,
					delay: reduceMotion ? 0 : delay,
					ease: [0.16, 1, 0.3, 1],
				}}
			/>
		</div>
	)
}

export function MovieRatings({ tmdbScore, tmdbVotes, external }: MovieRatingsProps) {
	const sectionRef = useRef<HTMLElement>(null)
	useRevealOnScroll(sectionRef)
	const reduceMotion = useReducedMotion()

	if (tmdbScore <= 0 && !external.imdb && !external.rottenTomatoes && !external.metacritic) {
		return null
	}

	const { primary, others } = buildSources(tmdbScore, tmdbVotes, external)

	return (
		<section ref={sectionRef} className="space-y-8" aria-label="Movie ratings">
			<div>
				<p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
					Scores
				</p>
				<h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] text-balance md:text-4xl">
					Ratings
				</h2>
			</div>

			<div className="relative overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[linear-gradient(145deg,rgba(255,77,61,0.08)_0%,transparent_42%),var(--color-ink-elevated)]">
				{/* Primary — TMDB */}
				<div className="grid gap-6 px-6 py-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] md:items-end md:gap-10 md:px-8 md:py-8">
					<div>
						<p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
							{primary.label}
						</p>
						<div className="mt-2 flex items-baseline gap-2">
							<motion.span
								className="font-heading text-6xl font-bold leading-none tracking-tight text-[var(--color-text)] md:text-7xl"
								initial={reduceMotion ? false : { opacity: 0, y: 12 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
							>
								{primary.display}
							</motion.span>
							<span className="font-mono text-sm text-[var(--color-text-secondary)]">/10</span>
						</div>
						{primary.sub ? (
							<p className="mt-3 text-sm text-[var(--color-text-secondary)]">{primary.sub}</p>
						) : null}
					</div>

					<div className="space-y-3">
						<div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
							<span>Audience signal</span>
							<span className="font-mono text-[var(--color-text-secondary)]">
								{Math.round(primary.percent)}%
							</span>
						</div>
						<Meter percent={primary.percent} tone={primary.tone} />
						<p className="text-xs text-[var(--color-text-muted)]">House score on a 0–10 scale</p>
					</div>
				</div>

				{others.length > 0 ? (
					<ul className="grid border-t border-[var(--color-border)] sm:grid-cols-3">
						{others.map((source, index) => (
							<li
								key={source.key}
								className="border-[var(--color-border)] px-6 py-5 sm:px-6 sm:py-6 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:not(:last-child)]:border-r"
							>
								<div className="flex items-start justify-between gap-3">
									<div>
										<p
											className="text-[11px] font-semibold uppercase tracking-[0.16em]"
											style={{ color: source.tone }}
										>
											{source.label}
										</p>
										{source.sub ? (
											<p className="mt-1 text-xs text-[var(--color-text-muted)]">{source.sub}</p>
										) : null}
									</div>
									<p className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
										{source.display}
									</p>
								</div>
								<div className="mt-4">
									<Meter percent={source.percent} tone={source.tone} delay={0.08 * (index + 1)} />
								</div>
							</li>
						))}
					</ul>
				) : null}
			</div>
		</section>
	)
}
