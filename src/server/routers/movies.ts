import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { redis } from "@/lib/db/redis"
import { getMovieExternalRatings } from "@/lib/omdb/getMovieExternalRatings"
import { getTrailerKey } from "@/lib/tmdb/helpers"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBGenre, TMDBMovie, TMDBMovieDetail, TMDBResponse } from "@/lib/tmdb/types"
import { publicProcedure, router } from "@/server/trpc"

async function getCachedOrFetch<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>) {
	const cached = await redis.get(key)

	if (cached) {
		return JSON.parse(cached) as T
	}

	const data = await fetcher()
	await redis.set(key, JSON.stringify(data), "EX", ttlSeconds)
	return data
}

function throwTMDBError(cause: unknown, message: string): never {
	throw new TRPCError({
		code: "BAD_GATEWAY",
		message,
		cause: cause instanceof Error ? cause : undefined,
	})
}

export const moviesRouter = router({
	getTrending: publicProcedure.query(async () => {
		try {
			return await getCachedOrFetch<TMDBResponse<TMDBMovie>>("tmdb:trending", 3600, () =>
				tmdb.getTrending(),
			)
		} catch (error) {
			throwTMDBError(error, "Failed to fetch trending movies")
		}
	}),

	getPopular: publicProcedure
		.input(
			z
				.object({
					page: z.number().int().min(1).default(1),
				})
				.optional(),
		)
		.query(async ({ input }) => {
			const page = input?.page ?? 1
			const cacheKey = `tmdb:popular:${page}`

			try {
				return await getCachedOrFetch<TMDBResponse<TMDBMovie>>(cacheKey, 3600, () =>
					tmdb.getPopular(page),
				)
			} catch (error) {
				throwTMDBError(error, "Failed to fetch popular movies")
			}
		}),

	search: publicProcedure
		.input(
			z.object({
				query: z.string().trim().min(1, "Query is required"),
				page: z.number().int().min(1).default(1),
			}),
		)
		.query(async ({ input }) => {
			const normalizedQuery = input.query.trim().toLowerCase()
			const cacheKey = `tmdb:search:${encodeURIComponent(normalizedQuery)}:${input.page}`

			try {
				return await getCachedOrFetch<TMDBResponse<TMDBMovie>>(cacheKey, 300, () =>
					tmdb.searchMovies(input.query, input.page),
				)
			} catch {
				return {
					results: [],
					total_pages: 0,
					total_results: 0,
					page: input.page,
				} satisfies TMDBResponse<TMDBMovie>
			}
		}),

	getByGenre: publicProcedure
		.input(
			z.object({
				genreId: z.number().int().positive(),
				page: z.number().int().min(1).default(1),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `tmdb:genre:${input.genreId}:${input.page}`

			try {
				return await getCachedOrFetch<TMDBResponse<TMDBMovie>>(cacheKey, 3600, () =>
					tmdb.getByGenre(input.genreId, input.page),
				)
			} catch (error) {
				throwTMDBError(error, "Failed to fetch movies by genre")
			}
		}),

	getById: publicProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `tmdb:movie:${input.id}`

			try {
				return await getCachedOrFetch<TMDBMovieDetail>(cacheKey, 3600, () =>
					tmdb.getMovieById(input.id),
				)
			} catch (error) {
				throwTMDBError(error, "Failed to fetch movie details")
			}
		}),

	getExternalRatings: publicProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.query(async ({ input }) => getMovieExternalRatings(input.id)),

	getTrailer: publicProcedure
		.input(
			z.object({
				id: z.number().int().positive(),
			}),
		)
		.query(async ({ input }) => {
			const cacheKey = `tmdb:movie:trailer:${input.id}`

			try {
				return await getCachedOrFetch<{ trailerKey: string | null; source: "fetched" }>(
					cacheKey,
					3600,
					async () => {
						const videos = await tmdb.getMovieVideos(input.id)
						return {
							trailerKey: getTrailerKey(videos.results ?? []),
							source: "fetched",
						}
					},
				)
			} catch {
				return { trailerKey: null, source: "error" as const }
			}
		}),

	getGenres: publicProcedure.query(async () => {
		try {
			return await getCachedOrFetch<{ genres: TMDBGenre[] }>("tmdb:genres", 86400, () =>
				tmdb.getGenres(),
			)
		} catch (error) {
			throwTMDBError(error, "Failed to fetch genres")
		}
	}),
})
