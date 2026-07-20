"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { LayoutGrid, List, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"

import { WatchlistButton } from "@/components/movie/WatchlistButton"
import { useWatchlist } from "@/hooks/useWatchlist"
import { tmdb } from "@/lib/tmdb/client"
import { cn } from "@/lib/utils"
import type { WatchlistItem } from "@/types"

gsap.registerPlugin(useGSAP)

type SortKey = "newest" | "oldest" | "title"
type ViewMode = "grid" | "list"

type WatchlistViewProps = {
	variant?: "page" | "embedded"
}

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function toMovie(item: WatchlistItem) {
	return {
		id: item.movieId,
		title: item.title,
		overview: "",
		poster_path: item.poster ?? null,
		backdrop_path: null,
		release_date: "",
		vote_average: 0,
		genre_ids: [],
	}
}

export function WatchlistView({ variant = "page" }: WatchlistViewProps) {
	const { watchlist, isLoading } = useWatchlist()
	const [query, setQuery] = useState("")
	const [sort, setSort] = useState<SortKey>("newest")
	const [view, setView] = useState<ViewMode>("grid")
	const stageRef = useRef<HTMLDivElement>(null)

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		let items = watchlist
		if (q) {
			items = items.filter((item) => item.title.toLowerCase().includes(q))
		}
		const sorted = [...items]
		if (sort === "newest") {
			sorted.sort(
				(a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime(),
			)
		} else if (sort === "oldest") {
			sorted.sort(
				(a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime(),
			)
		} else {
			sorted.sort((a, b) => a.title.localeCompare(b.title))
		}
		return sorted
	}, [watchlist, query, sort])

	const featured = variant === "page" && !query ? filtered[0] : null
	const rest = featured ? filtered.slice(1) : filtered

	useGSAP(
		() => {
			if (!stageRef.current || isLoading || prefersReducedMotion()) return
			const bits = stageRef.current.querySelectorAll("[data-watch-bit]")
			if (!bits.length) return
			gsap.fromTo(
				bits,
				{ opacity: 0, y: 18 },
				{
					opacity: 1,
					y: 0,
					duration: 0.45,
					stagger: 0.035,
					ease: "power2.out",
					overwrite: true,
				},
			)
		},
		{
			dependencies: [isLoading, filtered.length, view, sort, query],
			scope: stageRef,
		},
	)

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
				{Array.from({ length: 10 }).map((_, i) => (
					<div
						key={i}
						className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--color-surface)]"
					/>
				))}
			</div>
		)
	}

	if (!watchlist.length) {
		return (
			<div className="max-w-md space-y-4 py-6">
				<p className="text-sm font-semibold text-[var(--color-text)]">
					Your watchlist is empty
				</p>
				<p className="text-sm text-[var(--color-text-muted)]">
					Save films from Explore or any movie page to queue them here.
				</p>
				<Link
					href="/explore"
					className="inline-flex rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
				>
					Browse films
				</Link>
			</div>
		)
	}

	return (
		<div ref={stageRef} className="space-y-6">
			<div
				data-watch-bit
				className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-center sm:justify-between"
			>
				<p className="text-sm text-[var(--color-text-secondary)]">
					{filtered.length} of {watchlist.length} saved
				</p>

				<div className="flex flex-wrap items-center gap-2">
					<label className="relative min-w-[12rem] flex-1 sm:flex-none">
						<span className="sr-only">Search watchlist</span>
						<Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
						<input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search titles"
							className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] py-2 pl-9 pr-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"
						/>
					</label>

					<select
						value={sort}
						onChange={(event) => setSort(event.target.value as SortKey)}
						aria-label="Sort watchlist"
						className="rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text-muted)]"
					>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
						<option value="title">Title A–Z</option>
					</select>

					<div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
						<button
							type="button"
							aria-label="Grid view"
							aria-pressed={view === "grid"}
							onClick={() => setView("grid")}
							className={cn(
								"rounded-md p-2 transition-colors",
								view === "grid"
									? "bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
									: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
							)}
						>
							<LayoutGrid className="h-4 w-4" />
						</button>
						<button
							type="button"
							aria-label="List view"
							aria-pressed={view === "list"}
							onClick={() => setView("list")}
							className={cn(
								"rounded-md p-2 transition-colors",
								view === "list"
									? "bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
									: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
							)}
						>
							<List className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{filtered.length === 0 ? (
				<p className="py-10 text-sm text-[var(--color-text-muted)]">
					No titles match “{query}”
				</p>
			) : null}

			{featured ? (
				<article
					data-watch-bit
					className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)]"
				>
					<div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
						<div className="relative aspect-[16/10] md:aspect-auto md:min-h-[280px]">
							{featured.poster ? (
								<Image
									src={tmdb.getImageUrl(featured.poster, "w500")}
									alt=""
									fill
									unoptimized
									sizes="(max-width: 768px) 100vw, 40vw"
									className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
									priority
								/>
							) : (
								<div className="h-full w-full bg-[var(--color-surface)]" />
							)}
							<div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink-elevated)] via-transparent to-transparent md:bg-gradient-to-r" />
						</div>
						<div className="relative flex flex-col justify-between gap-6 p-5 md:p-8">
							<div>
								<p className="text-xs font-medium text-[var(--color-signal)]">
									Up next
								</p>
								<h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[var(--color-text)] md:text-3xl">
									{featured.title}
								</h2>
								<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
									Saved{" "}
									{new Date(featured.addedAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Link
									href={`/movie/${featured.movieId}`}
									className="rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
								>
									Open film
								</Link>
								<div className="rounded-lg border border-[var(--color-border)]">
									<WatchlistButton movie={toMovie(featured)} variant="icon" />
								</div>
							</div>
						</div>
					</div>
				</article>
			) : null}

			{rest.length > 0 && view === "grid" ? (
				<ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{rest.map((item, index) => (
						<li
							key={item.movieId}
							data-watch-bit
							className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)]"
						>
							<Link href={`/movie/${item.movieId}`} className="block">
								<div className="relative aspect-[2/3] bg-[var(--color-surface)]">
									{item.poster ? (
										<Image
											src={tmdb.getImageUrl(item.poster, "w200")}
											alt=""
											fill
											unoptimized
											sizes="180px"
											className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
										/>
									) : null}
									<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-12">
										{variant === "page" ? (
											<span className="mb-1 block font-mono text-[10px] text-white/50">
												{String(index + (featured ? 2 : 1)).padStart(2, "0")}
											</span>
										) : null}
										<p className="line-clamp-2 text-sm font-medium text-white">
											{item.title}
										</p>
									</div>
								</div>
							</Link>
							<div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
								<div className="rounded-full bg-[var(--color-ink)]/70 backdrop-blur-sm">
									<WatchlistButton movie={toMovie(item)} variant="icon" />
								</div>
							</div>
						</li>
					))}
				</ul>
			) : null}

			{rest.length > 0 && view === "list" ? (
				<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
					{rest.map((item, index) => (
						<li
							key={item.movieId}
							data-watch-bit
							className="flex items-center gap-4 px-3 py-3 transition-colors hover:bg-white/[0.02] sm:px-4"
						>
							<span className="hidden w-6 font-mono text-xs text-[var(--color-text-muted)] sm:block">
								{String(index + (featured ? 2 : 1)).padStart(2, "0")}
							</span>
							<Link
								href={`/movie/${item.movieId}`}
								className="relative h-16 w-11 flex-none overflow-hidden rounded-md bg-[var(--color-surface)]"
							>
								{item.poster ? (
									<Image
										src={tmdb.getImageUrl(item.poster, "w200")}
										alt=""
										fill
										unoptimized
										sizes="44px"
										className="object-cover"
									/>
								) : null}
							</Link>
							<div className="min-w-0 flex-1">
								<Link
									href={`/movie/${item.movieId}`}
									className="block truncate text-sm font-medium text-[var(--color-text)] transition-colors hover:text-[var(--color-signal)]"
								>
									{item.title}
								</Link>
								<p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">
									Saved{" "}
									{new Date(item.addedAt).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
								</p>
							</div>
							<WatchlistButton movie={toMovie(item)} variant="icon" />
						</li>
					))}
				</ul>
			) : null}
		</div>
	)
}
