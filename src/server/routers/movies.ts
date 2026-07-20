import { TRPCError } from "@trpc/server"
import { and, count, desc, gte, lte, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { redis } from "@/lib/db/redis"
import { ratings } from "@/lib/db/schema"
import { getMovieExternalRatings } from "@/lib/omdb/getMovieExternalRatings"
import { getTrailerKey } from "@/lib/tmdb/helpers"
import { tmdb } from "@/lib/tmdb/client"
import type {
	TMDBGenre,
	TMDBMovie,
	TMDBMovieDetail,
	TMDBPerson,
	TMDBResponse,
} from "@/lib/tmdb/types"
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

function formatDate(date: Date) {
	return date.toISOString().slice(0, 10)
}

function getChartPeriodMeta(period: "month" | "year") {
	const now = new Date()
	const year = now.getUTCFullYear()
	const month = now.getUTCMonth()

	if (period === "month") {
		const start = new Date(Date.UTC(year, month, 1))
		const end = new Date(Date.UTC(year, month + 1, 0))
		const cacheSuffix = `${year}-${String(month + 1).padStart(2, "0")}`
		return {
			start,
			end: end > now ? now : end,
			releaseGte: formatDate(start),
			releaseLte: formatDate(end),
			voteCountGte: 50,
			cacheSuffix,
		}
	}

	const start = new Date(Date.UTC(year, 0, 1))
	return {
		start,
		end: now,
		releaseGte: formatDate(start),
		releaseLte: formatDate(now),
		voteCountGte: 100,
		cacheSuffix: String(year),
	}
}

function filterPeople(people: TMDBPerson[]) {
	return people
		.filter((person) => {
			if (!person.known_for?.length) return true
			return person.known_for.some(
				(item) => item.media_type === "movie" || Boolean(item.title),
			)
		})
		.slice(0, 10)
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

	getCharts: publicProcedure
		.input(
			z.object({
				period: z.enum(["month", "year"]).default("month"),
				category: z.enum(["movies", "actors"]).default("movies"),
			}),
		)
		.query(async ({ input }) => {
			const meta = getChartPeriodMeta(input.period)
			const cacheKey = `tmdb:charts:${input.period}:${input.category}:${meta.cacheSuffix}`

			try {
				if (input.category === "movies") {
					const movies = await getCachedOrFetch<TMDBMovie[]>(cacheKey, 3600, async () => {
						const response = await tmdb.discoverMovies({
							sortBy: "popularity.desc",
							primaryReleaseDateGte: meta.releaseGte,
							primaryReleaseDateLte: meta.releaseLte,
							voteCountGte: meta.voteCountGte,
						})
						return (response.results ?? []).slice(0, 10)
					})

					return { category: "movies" as const, movies }
				}

				const actors = await getCachedOrFetch<TMDBPerson[]>(cacheKey, 3600, async () => {
					const response =
						input.period === "month"
							? await tmdb.getTrendingPeople("week")
							: await tmdb.getPopularPeople(1)
					return filterPeople(response.results ?? [])
				})

				return { category: "actors" as const, actors }
			} catch (error) {
				throwTMDBError(error, "Failed to fetch charts")
			}
		}),

	getCommunityTop: publicProcedure
		.input(
			z.object({
				period: z.enum(["month", "year"]).default("month"),
			}),
		)
		.query(async ({ input }) => {
			const meta = getChartPeriodMeta(input.period)
			const cacheKey = `frameo:community-top:${input.period}:${meta.cacheSuffix}`

			return getCachedOrFetch(cacheKey, 600, async () => {
				const rows = await db
					.select({
						movieId: ratings.movieId,
						title: sql<string>`max(${ratings.title})`.mapWith(String),
						poster: sql<string | null>`max(${ratings.poster})`,
						ratingCount: count(),
						avgRating: sql<number>`avg(${ratings.rating})::float`.mapWith(Number),
					})
					.from(ratings)
					.where(and(gte(ratings.createdAt, meta.start), lte(ratings.createdAt, meta.end)))
					.groupBy(ratings.movieId)
					.having(sql`count(*) >= 2`)
					.orderBy(desc(count()), desc(sql`avg(${ratings.rating})`))
					.limit(10)

				return rows.map((row) => ({
					movieId: row.movieId,
					title: row.title,
					poster: row.poster,
					ratingCount: Number(row.ratingCount),
					avgRating: Number(row.avgRating),
				}))
			})
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
