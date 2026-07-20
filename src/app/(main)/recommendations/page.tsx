"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useRef, useState } from "react"

import { AIRecommendationPanel } from "@/components/recommendation/AIRecommendationPanel"
import { GenreFilter } from "@/components/recommendation/GenreFilter"
import { MoodSelector } from "@/components/recommendation/MoodSelector"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { trpc } from "@/lib/trpc/client"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function RecommendationsPage() {
	const [mood, setMood] = useState("")
	const [selectedGenre, setSelectedGenre] = useState("")
	const [watchableOnly, setWatchableOnly] = useState(false)
	const [hasGenerated, setHasGenerated] = useState(false)
	const [isManualLoading, setIsManualLoading] = useState(false)

	const pageRef = useRef<HTMLDivElement>(null)
	const brandRef = useRef<HTMLParagraphElement>(null)
	const titleRef = useRef<HTMLHeadingElement>(null)
	const supportRef = useRef<HTMLParagraphElement>(null)
	const formRef = useRef<HTMLElement>(null)

	const { data: genresData } = trpc.movies.getGenres.useQuery()

	const {
		data: recommendationsData,
		refetch: refetchRecommendations,
		isLoading,
		error,
	} = trpc.recommendations.getRecommendations.useQuery(
		{
			mood: mood || undefined,
			genre: selectedGenre || undefined,
			limit: 10,
			watchableOnly,
		},
		{ enabled: false },
	)

	const genres = genresData?.genres || []
	const recommendations = recommendationsData || []
	const canGenerate = Boolean(mood || selectedGenre)
	const busy = isManualLoading || isLoading

	useGSAP(
		() => {
			if (prefersReducedMotion()) return
			const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
			tl.fromTo(brandRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 })
				.fromTo(titleRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.65 }, 0.08)
				.fromTo(
					supportRef.current,
					{ opacity: 0, y: 14 },
					{ opacity: 1, y: 0, duration: 0.5 },
					0.18,
				)
				.fromTo(
					formRef.current,
					{ opacity: 0, y: 28, filter: "blur(8px)" },
					{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7 },
					0.22,
				)
		},
		{ scope: pageRef },
	)

	const handleGenerate = async () => {
		if (!canGenerate) return

		setHasGenerated(true)
		setIsManualLoading(true)

		try {
			await refetchRecommendations()
		} finally {
			setIsManualLoading(false)
		}
	}

	const handleChangePreferences = () => {
		setHasGenerated(false)
		setMood("")
		setSelectedGenre("")
		setIsManualLoading(false)
	}

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="relative min-h-screen overflow-hidden bg-[var(--color-ink)] pb-20 pt-10"
			>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(255,77,61,0.14),transparent_65%)]"
				/>

				<section className="relative mx-auto max-w-3xl px-6 text-center md:px-12">
					<p
						ref={brandRef}
						className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]"
					>
						Frameo · Curator
					</p>
					<h1
						ref={titleRef}
						className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] text-balance md:text-5xl"
					>
						Your personal cut
					</h1>
					<p
						ref={supportRef}
						className="mx-auto mt-3 max-w-lg text-base text-[var(--color-text-secondary)]"
					>
						Pick a mood and genre — we&apos;ll pull frames that fit tonight.
					</p>
				</section>

				<section
					ref={formRef}
					className="relative mx-auto mt-10 max-w-3xl px-6 md:px-12"
				>
					<div className="space-y-8 rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/80 p-6 backdrop-blur-sm md:p-8">
						<div>
							<p className="mb-3 text-sm font-medium text-[var(--color-text)]">
								How are you feeling?
							</p>
							<MoodSelector selected={mood} onChange={setMood} />
						</div>

						<div>
							<p className="mb-3 text-sm font-medium text-[var(--color-text)]">
								Genre preference
							</p>
							<GenreFilter
								selected={selectedGenre}
								onChange={setSelectedGenre}
								genres={genres}
							/>
						</div>

						<div className="space-y-2 border-t border-[var(--color-border)] pt-6">
							<label className="flex cursor-pointer items-start gap-3 text-sm text-[var(--color-text-secondary)]">
								<input
									type="checkbox"
									checked={watchableOnly}
									onChange={(event) => setWatchableOnly(event.target.checked)}
									className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] bg-transparent accent-[var(--color-signal)]"
								/>
								<span>
									Watchable now on my streaming services
									{watchableOnly ? (
										<span className="mt-1 block text-xs text-[var(--color-text-muted)]">
											Set services in{" "}
											<Link
												href="/profile"
												className="text-[var(--color-signal)] underline-offset-2 hover:underline"
											>
												Edit Profile
											</Link>
										</span>
									) : null}
								</span>
							</label>
						</div>

						<button
							type="button"
							onClick={handleGenerate}
							disabled={busy || !canGenerate}
							className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-signal)] px-8 py-3.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:cursor-not-allowed disabled:opacity-40"
						>
							{busy ? (
								<>
									<LoadingSpinner size="sm" />
									Curating…
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									Generate recommendations
								</>
							)}
						</button>
					</div>
				</section>

				{hasGenerated ? (
					<section className="relative mx-auto mt-14 max-w-7xl px-6 md:px-12">
						<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
							<div>
								<p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
									Results
								</p>
								<h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]">
									Tonight&apos;s shortlist
								</h2>
							</div>
							{!busy && recommendations.length > 0 ? (
								<div className="flex flex-wrap gap-2">
									<button
										type="button"
										onClick={handleGenerate}
										className="rounded-full border border-[var(--color-signal-border)] px-5 py-2 text-sm font-semibold text-[var(--color-signal)] transition-colors hover:bg-[var(--color-signal-muted)]"
									>
										Regenerate
									</button>
									<button
										type="button"
										onClick={handleChangePreferences}
										className="rounded-full px-5 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
									>
										Change preferences
									</button>
								</div>
							) : null}
						</div>

						{error ? (
							<div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6">
								<p className="text-red-300">
									{error.message || "Failed to generate recommendations"}
								</p>
								<button
									type="button"
									onClick={handleGenerate}
									className="mt-4 rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
								>
									Retry
								</button>
							</div>
						) : (
							<AIRecommendationPanel
								recommendations={recommendations}
								isLoading={busy}
							/>
						)}
					</section>
				) : (
					<div className="relative mx-auto mt-16 max-w-md px-6 text-center">
						<p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
							Waiting
						</p>
						<p className="mt-2 font-heading text-xl font-semibold text-[var(--color-text-secondary)]">
							Your shortlist lands here
						</p>
						<p className="mt-1 text-sm text-[var(--color-text-muted)]">
							Choose a mood or genre, then generate
						</p>
					</div>
				)}
			</div>
		</AuthGuard>
	)
}
