"use client"

import { motion } from "framer-motion"
import { ArrowDown, Film } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { MovieGrid } from "@/components/movie/MovieGrid"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { SearchBar } from "@/components/shared/SearchBar"
import { listItem, staggerContainerFast } from "@/lib/animations"
import { trpc } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { cn } from "@/lib/utils"

const expoOut = [0.16, 1, 0.3, 1] as const

export default function ExplorePage() {
	const searchParams = useSearchParams()
	const initialQuery = searchParams.get("q") ?? ""
	const initialGenreParam = searchParams.get("genre")
	const initialGenre = initialGenreParam ? Number(initialGenreParam) : null

	const [activeGenre, setActiveGenre] = useState<number | null>(
		Number.isFinite(initialGenre) && initialGenre! > 0 ? initialGenre : null,
	)
	const [searchQuery, setSearchQuery] = useState(initialQuery)
	const [page, setPage] = useState(1)
	const [movies, setMovies] = useState<TMDBMovie[]>([])

	const normalizedSearch = searchQuery.trim()

	const modeKey = useMemo(() => {
		if (normalizedSearch) return `search:${normalizedSearch}`
		if (activeGenre) return `genre:${activeGenre}`
		return "popular"
	}, [activeGenre, normalizedSearch])

	const genresQuery = trpc.movies.getGenres.useQuery()
	const popularQuery = trpc.movies.getPopular.useQuery(
		{ page },
		{ enabled: !normalizedSearch && activeGenre === null },
	)
	const searchResults = trpc.movies.search.useQuery(
		{ query: normalizedSearch, page },
		{ enabled: normalizedSearch.length > 0 },
	)
	const genreResults = trpc.movies.getByGenre.useQuery(
		{ genreId: activeGenre ?? 0, page },
		{ enabled: activeGenre !== null && normalizedSearch.length === 0 },
	)

	const activeResults = normalizedSearch
		? searchResults.data
		: activeGenre !== null
			? genreResults.data
			: popularQuery.data

	const isLoading =
		genresQuery.isLoading ||
		popularQuery.isLoading ||
		searchResults.isLoading ||
		genreResults.isLoading

	const isFetchingMore =
		page > 1 &&
		(popularQuery.isFetching || searchResults.isFetching || genreResults.isFetching)

	const activeGenreName =
		activeGenre === null
			? null
			: (genresQuery.data?.genres.find((genre) => genre.id === activeGenre)?.name ?? null)

	const resultsLabel = normalizedSearch
		? `Results for “${normalizedSearch}”`
		: activeGenreName
			? activeGenreName
			: "Popular now"

	useEffect(() => {
		setPage(1)
	}, [modeKey])

	useEffect(() => {
		const genreParam = searchParams.get("genre")
		if (!genreParam) return
		const parsed = Number(genreParam)
		if (Number.isFinite(parsed) && parsed > 0) {
			setActiveGenre(parsed)
			setSearchQuery("")
		}
	}, [searchParams])

	useEffect(() => {
		if (!activeResults) return

		setMovies((prev) => {
			if (page === 1) {
				return activeResults.results
			}

			const existing = new Set(prev.map((movie) => movie.id))
			const next = activeResults.results.filter((movie) => !existing.has(movie.id))
			return [...prev, ...next]
		})
	}, [activeResults, page])

	const selectGenre = (genreId: number | null) => {
		setSearchQuery("")
		setActiveGenre(genreId)
	}

	const handleSearch = useCallback((query: string) => {
		setSearchQuery(query)
		if (query.trim()) setActiveGenre(null)
	}, [])

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
						Browse
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 18 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.05, ease: expoOut }}
						className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-6xl"
					>
						Explore
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.1, ease: expoOut }}
						className="mt-3 max-w-xl text-base text-[var(--color-text-secondary)] md:text-lg"
					>
						Search the catalog or filter by mood — then open the frame that fits tonight.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.55, delay: 0.16, ease: expoOut }}
						className="mt-8 max-w-2xl"
					>
						<SearchBar
							className="w-full"
							placeholder="Search titles, moods, keywords…"
							defaultValue={initialQuery}
							onSearch={handleSearch}
						/>
					</motion.div>
				</div>
			</section>

			<div className="sticky top-16 z-30 border-b border-[var(--color-border)] bg-[var(--color-ink)]/85 backdrop-blur-xl">
				<div className="mx-auto max-w-7xl px-6 py-3 md:px-12">
					<motion.div
						className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						variants={staggerContainerFast}
						initial="hidden"
						animate="visible"
					>
						<motion.button
							type="button"
							variants={listItem}
							whileTap={{ scale: 0.97 }}
							onClick={() => selectGenre(null)}
							className={cn(
								"flex-none rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
								activeGenre === null && !normalizedSearch
									? "border-[var(--color-signal)] bg-[var(--color-signal)] text-[var(--color-ink)]"
									: "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-border)] hover:text-[var(--color-text)]",
							)}
						>
							All
						</motion.button>

						{genresQuery.data?.genres.map((genre) => {
							const selected = activeGenre === genre.id && !normalizedSearch
							return (
								<motion.button
									key={genre.id}
									type="button"
									variants={listItem}
									whileTap={{ scale: 0.97 }}
									onClick={() => selectGenre(genre.id)}
									className={cn(
										"flex-none rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
										selected
											? "border-[var(--color-signal)] bg-[var(--color-signal)] text-[var(--color-ink)]"
											: "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-border)] hover:text-[var(--color-text)]",
									)}
								>
									{genre.name}
								</motion.button>
							)
						})}
					</motion.div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-12 md:py-14">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
							Catalog
						</p>
						<h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-[var(--color-text)] md:text-3xl">
							{resultsLabel}
						</h2>
					</div>
					{activeResults ? (
						<p className="font-mono text-xs text-[var(--color-text-secondary)]">
							{movies.length.toLocaleString()} shown
							{activeResults.total_results
								? ` · ${activeResults.total_results.toLocaleString()} total`
								: null}
						</p>
					) : null}
				</div>

				{!isLoading && movies.length === 0 ? (
					<div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-6 py-20 text-center">
						<div className="rounded-full bg-[var(--color-signal-muted)] p-4 text-[var(--color-signal)]">
							<Film className="h-7 w-7" />
						</div>
						<div>
							<p className="font-heading text-xl font-semibold text-[var(--color-text)]">
								No frames found
							</p>
							<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
								Try another search or clear the genre filter.
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setSearchQuery("")
								setActiveGenre(null)
							}}
							className="rounded-full border border-[var(--color-signal)] px-5 py-2 text-sm font-medium text-[var(--color-signal)] transition-colors hover:bg-[var(--color-signal-muted)]"
						>
							Reset explore
						</button>
					</div>
				) : (
					<MovieGrid movies={movies} loading={isLoading && movies.length === 0} />
				)}

				{activeResults && page < activeResults.total_pages ? (
					<div className="flex justify-center pt-2">
						<motion.button
							type="button"
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							disabled={isFetchingMore}
							onClick={() => setPage((prev) => prev + 1)}
							className="inline-flex items-center gap-2 rounded-full border border-[var(--color-signal)] bg-transparent px-6 py-3 text-sm font-semibold text-[var(--color-signal)] transition-colors hover:bg-[var(--color-signal-muted)] disabled:opacity-60"
						>
							{isFetchingMore ? (
								<>
									<LoadingSpinner size="sm" />
									Loading…
								</>
							) : (
								<>
									Load more
									<ArrowDown className="h-4 w-4" />
								</>
							)}
						</motion.button>
					</div>
				) : null}
			</div>
		</div>
	)
}
