"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ArrowRight, EyeOff, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { RatingStars } from "@/components/shared/RatingStars"
import { useToastContext } from "@/components/shared/ToastProvider"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"
import type { RecommendationResult } from "@/types"

gsap.registerPlugin(useGSAP)

type AIRecommendationPanelProps = {
	recommendations: RecommendationResult[]
	isLoading: boolean
}

const loadingMessages = [
	"Reading your taste map…",
	"Pulling adjacent frames…",
	"Scoring the shortlist…",
	"Locking the cut…",
]

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function AIRecommendationPanel({
	recommendations,
	isLoading,
}: AIRecommendationPanelProps) {
	const [messageIndex, setMessageIndex] = useState(0)
	const [openWhy, setOpenWhy] = useState<number | null>(null)
	const listRef = useRef<HTMLDivElement>(null)
	const { showToast } = useToastContext()
	const utils = trpc.useUtils()
	const hideVibe = trpc.taste.hideVibe.useMutation({
		onSuccess: async () => {
			showToast("Got it — we'll tone down that vibe", "success")
			await utils.recommendations.getRecommendations.invalidate()
		},
	})

	useEffect(() => {
		if (!isLoading) return
		const interval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
		}, 1500)
		return () => clearInterval(interval)
	}, [isLoading])

	useGSAP(
		() => {
			if (isLoading || !listRef.current || prefersReducedMotion()) return
			const cards = listRef.current.querySelectorAll("[data-rec-card]")
			gsap.fromTo(
				cards,
				{ opacity: 0, y: 28, filter: "blur(6px)" },
				{
					opacity: 1,
					y: 0,
					filter: "blur(0px)",
					duration: 0.55,
					stagger: 0.07,
					ease: "expo.out",
				},
			)
		},
		{ dependencies: [isLoading, recommendations], scope: listRef },
	)

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center gap-6 py-20">
				<div className="relative h-16 w-16">
					<div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-signal)]" />
					<div className="absolute inset-3 rounded-full bg-[var(--color-signal-muted)]" />
				</div>
				<p className="text-center text-base text-[var(--color-text-secondary)]">
					{loadingMessages[messageIndex]}
				</p>
			</div>
		)
	}

	if (recommendations.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
				<p className="font-heading text-2xl font-bold text-[var(--color-text)]">No matches</p>
				<p className="text-sm text-[var(--color-text-secondary)]">
					Try another mood, genre, or turn off Watchable now
				</p>
			</div>
		)
	}

	return (
		<div ref={listRef} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
			{recommendations.map((rec, index) => {
				const match = Math.round(rec.score * 100)
				const year = rec.movie.release_date
					? new Date(rec.movie.release_date).getFullYear()
					: null

				return (
					<article
						key={rec.movie.id}
						data-rec-card
						className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)]"
					>
						<div className="relative h-36 overflow-hidden">
							{rec.movie.backdrop_path || rec.movie.poster_path ? (
								<Image
									src={tmdb.getImageUrl(
										rec.movie.backdrop_path || rec.movie.poster_path!,
										"w780",
									)}
									alt=""
									fill
									unoptimized
									sizes="(max-width: 768px) 100vw, 33vw"
									className="object-cover transition-transform duration-500 group-hover:scale-105"
								/>
							) : (
								<div className="h-full w-full bg-[var(--color-surface)]" />
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink-elevated)] via-[var(--color-ink-elevated)]/40 to-transparent" />
							<span className="absolute left-3 top-3 font-mono text-[11px] text-[var(--color-text)]/80">
								{String(index + 1).padStart(2, "0")}
							</span>
							<span className="absolute right-3 top-3 rounded-full bg-[var(--color-ink)]/70 px-2.5 py-1 font-mono text-[11px] text-[var(--color-signal)] backdrop-blur-sm">
								{match}% match
							</span>
						</div>

						<div className="flex flex-1 flex-col gap-3 p-4 pt-0">
							<div className="-mt-10 flex gap-3">
								{rec.movie.poster_path ? (
									<div className="relative h-[5.5rem] w-[3.65rem] flex-none overflow-hidden rounded-lg border border-[var(--color-border)] shadow-lg">
										<Image
											src={tmdb.getImageUrl(rec.movie.poster_path, "w200")}
											alt=""
											fill
											unoptimized
											sizes="60px"
											className="object-cover"
										/>
									</div>
								) : null}
								<div className="min-w-0 pt-10">
									<h3 className="line-clamp-2 font-heading text-lg font-bold tracking-tight text-[var(--color-text)]">
										{rec.movie.title}
									</h3>
									<div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
										{year ? <span>{year}</span> : null}
										<RatingStars rating={rec.movie.vote_average || 0} size="sm" />
									</div>
								</div>
							</div>

							{rec.availableOn && rec.availableOn.length > 0 ? (
								<p className="text-[11px] text-[var(--color-cyan-rim)]">
									On {rec.availableOn.join(" · ")}
								</p>
							) : null}

							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-signal)]">
									Why you&apos;ll love it
								</p>
								<p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
									{rec.reason}
								</p>
							</div>

							<div
								className="h-1 overflow-hidden rounded-full bg-white/[0.06]"
								role="meter"
								aria-valuenow={match}
								aria-valuemin={0}
								aria-valuemax={100}
								aria-label="Match score"
							>
								<div
									className="h-full rounded-full bg-[var(--color-signal)]"
									style={{ width: `${match}%` }}
								/>
							</div>

							<div className="mt-auto flex flex-wrap gap-2 pt-1">
								<button
									type="button"
									onClick={() =>
										setOpenWhy((current) =>
											current === rec.movie.id ? null : rec.movie.id,
										)
									}
									className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]"
								>
									<Info className="h-3 w-3" />
									Why this?
								</button>
								{(rec.suggestedHideVibes ?? ["this vibe"]).slice(0, 1).map((vibe) => (
									<button
										key={vibe}
										type="button"
										disabled={hideVibe.isPending}
										onClick={() => hideVibe.mutate({ vibe })}
										className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-muted)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-50"
									>
										<EyeOff className="h-3 w-3" />
										Hide vibe
									</button>
								))}
								<Link
									href={`/movie/${rec.movie.id}`}
									className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--color-signal)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
								>
									View
									<ArrowRight className="h-3 w-3" />
								</Link>
							</div>

							{openWhy === rec.movie.id ? (
								<div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink)]/60 p-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
									<p className="mb-1.5 font-medium text-[var(--color-signal)]">Taste signals</p>
									{rec.similarLiked && rec.similarLiked.length > 0 ? (
										<p className="mb-1.5">Similar to likes: {rec.similarLiked.join(", ")}</p>
									) : (
										<p className="mb-1.5">Rate more films to sharpen these signals.</p>
									)}
									<p>{rec.reason}</p>
								</div>
							) : null}
						</div>
					</article>
				)
			})}
		</div>
	)
}
