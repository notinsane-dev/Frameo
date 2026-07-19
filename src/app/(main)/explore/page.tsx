"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { MovieGrid } from "@/components/movie/MovieGrid"
import { SearchBar } from "@/components/shared/SearchBar"
import { trpc } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { cn } from "@/lib/utils"

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") ?? ""

  const [activeGenre, setActiveGenre] = useState<number | null>(null)
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

  useEffect(() => {
    setPage(1)
  }, [modeKey])

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

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      <SearchBar
        className="w-full"
        placeholder="Search for movies, actors, or keywords"
        onSearch={(query) => setSearchQuery(query)}
      />

      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActiveGenre(null)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition-all duration-200",
            activeGenre === null
              ? "border-[#C9A84C] bg-[#C9A84C] text-[#080808]"
              : "border-white/10 bg-white/5 text-white/60 hover:border-[#C9A84C]/40",
          )}
        >
          All
        </button>

        {genresQuery.data?.genres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => setActiveGenre(genre.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all duration-200",
              activeGenre === genre.id
                ? "border-[#C9A84C] bg-[#C9A84C] text-[#080808]"
                : "border-white/10 bg-white/5 text-white/60 hover:border-[#C9A84C]/40",
            )}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <MovieGrid movies={movies} loading={isLoading && movies.length === 0} title="Explore Movies" />

      {activeResults && page < activeResults.total_pages ? (
        <div className="flex justify-center pt-4">
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-full border border-[#C9A84C] px-6 py-2 text-sm font-medium text-[#C9A84C] transition-colors duration-200 hover:bg-[#C9A84C]/10"
          >
            Load More
          </button>
        </div>
      ) : null}
    </div>
  )
}
