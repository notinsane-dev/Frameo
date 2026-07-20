import { TRPCError } from "@trpc/server"
import { and, cosineDistance, desc, eq, gte, isNotNull, notInArray, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"
import { movies, ratings, watchedLogs, watchlists } from "@/lib/db/schema"
import { resolveGenreFilterName } from "@/lib/embeddings/movies"
import { getOrCreateUserEmbedding } from "@/lib/embeddings/users"
import { redis } from "@/lib/db/redis"
import { generateContent } from "@/lib/gemini/client"
import { providerName } from "@/lib/streaming/providers"
import { ensureMovieProviders, overlapsProviders } from "@/lib/streaming/watchProviders"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie, TMDBMovieDetail } from "@/lib/tmdb/types"
import { protectedProcedure, router } from "@/server/trpc"
import type { RecommendationResult } from "@/types"

type GeminiRecommendation = {
	tmdbId: number
	title: string
	reason: string
	score: number
}

type VectorCandidate = {
	tmdbId: number
	title: string
	overview: string | null
	genres: string[]
	posterPath: string | null
	providerIds: string[]
	distance: number
}

function normalizeGeminiJson(raw: string): string {
	return raw.replace(/```json/gi, "").replace(/```/g, "").trim()
}

function parseNumeric(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value
	}

	if (typeof value === "string" && value.trim().length > 0) {
		const parsed = Number(value)
		if (Number.isFinite(parsed)) {
			return parsed
		}
	}

	return null
}

function normalizeScore(value: unknown): number | null {
	const numeric = parseNumeric(value)
	if (numeric === null) {
		return null
	}

	if (numeric <= 1) {
		return Math.max(0, Math.min(1, numeric))
	}

	if (numeric <= 10) {
		return Math.max(0, Math.min(1, numeric / 10))
	}

	return Math.max(0, Math.min(1, numeric / 100))
}

function extractJsonArray(raw: string): string {
	const normalized = normalizeGeminiJson(raw)
	if (normalized.startsWith("[") && normalized.endsWith("]")) {
		return normalized
	}

	const firstBracket = normalized.indexOf("[")
	const lastBracket = normalized.lastIndexOf("]")

	if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
		return normalized.slice(firstBracket, lastBracket + 1)
	}

	return normalized
}

function parseRecommendations(raw: string): GeminiRecommendation[] {
	const normalized = extractJsonArray(raw)

	let parsed: unknown
	try {
		parsed = JSON.parse(normalized)
	} catch {
		throw new TRPCError({
			code: "BAD_GATEWAY",
			message: "Failed to parse recommendations from Gemini",
		})
	}

	if (!Array.isArray(parsed)) {
		throw new TRPCError({
			code: "BAD_GATEWAY",
			message: "Gemini returned an invalid recommendations payload",
		})
	}

	const results: GeminiRecommendation[] = []

	for (const item of parsed) {
		if (!item || typeof item !== "object") {
			continue
		}

		const record = item as Record<string, unknown>
		const tmdbId = parseNumeric(record.tmdbId ?? record.tmdbID ?? record.tmdb_id ?? record.id)
		const title = record.title
		const reason = record.reason
		const score = normalizeScore(record.score)

		if (
			tmdbId !== null &&
			Number.isFinite(tmdbId) &&
			typeof title === "string" &&
			title.trim().length > 0 &&
			typeof reason === "string" &&
			reason.trim().length > 0 &&
			score !== null
		) {
			results.push({
				tmdbId: Math.round(tmdbId),
				title: title.trim(),
				reason: reason.trim(),
				score,
			})
		}
	}

	return results
}

async function buildFallbackRecommendations(limit: number, mood: string, genre?: string) {
	const genreId = Number(genre)
	const tmdbResponse =
		Number.isInteger(genreId) && genreId > 0
			? await tmdb.getByGenre(genreId, 1)
			: await tmdb.getPopular(1)

	const fallbackMovies = tmdbResponse.results.slice(0, limit)

	return fallbackMovies.map((movie, index) => ({
		movie,
		reason:
			mood === "any"
				? "Popular with audiences right now and a strong fit for your watch profile."
				: `A strong match for your ${mood} mood with broad audience appeal.`,
		score: Math.max(0.55, 0.9 - index * 0.03),
	})) satisfies RecommendationResult[]
}

function toTMDBMovie(detail: TMDBMovieDetail): TMDBMovie {
	return {
		id: detail.id,
		title: detail.title,
		overview: detail.overview,
		poster_path: detail.poster_path,
		backdrop_path: detail.backdrop_path,
		release_date: detail.release_date,
		vote_average: detail.vote_average,
		genre_ids: detail.genres?.map((genre) => genre.id) ?? [],
		genres: detail.genres,
	}
}

async function findVectorCandidates(
	userId: string,
	embedding: number[],
	limit: number,
	options?: {
		genreFilter?: string
		streamingServices?: string[]
		watchableOnly?: boolean
	},
): Promise<VectorCandidate[]> {
	const [ratedRows, watchlistRows, watchedRows] = await Promise.all([
		db.select({ movieId: ratings.movieId }).from(ratings).where(eq(ratings.userId, userId)),
		db.select({ movieId: watchlists.movieId }).from(watchlists).where(eq(watchlists.userId, userId)),
		db.select({ movieId: watchedLogs.movieId }).from(watchedLogs).where(eq(watchedLogs.userId, userId)),
	])

	const excludedIds = Array.from(
		new Set([
			...ratedRows.map((row) => row.movieId),
			...watchlistRows.map((row) => row.movieId),
			...watchedRows.map((row) => row.movieId),
		]),
	)

	const distance = cosineDistance(movies.embedding, embedding)
	const conditions = [isNotNull(movies.embedding)]

	if (excludedIds.length > 0) {
		conditions.push(notInArray(movies.tmdbId, excludedIds))
	}

	if (options?.genreFilter) {
		conditions.push(sql`${options.genreFilter} = any(${movies.genres})`)
	}

	const rows = await db
		.select({
			tmdbId: movies.tmdbId,
			title: movies.title,
			overview: movies.overview,
			genres: movies.genres,
			posterPath: movies.posterPath,
			providerIds: movies.providerIds,
			distance,
		})
		.from(movies)
		.where(and(...conditions))
		.orderBy(distance)
		.limit(Math.max(limit * 4, 30))

	const mapped = rows.map((row) => ({
		tmdbId: row.tmdbId,
		title: row.title,
		overview: row.overview,
		genres: row.genres ?? [],
		posterPath: row.posterPath,
		providerIds: row.providerIds ?? [],
		distance: Number(row.distance),
	}))

	if (!options?.watchableOnly || !options.streamingServices?.length) {
		return mapped.slice(0, Math.max(limit * 2, 15))
	}

	const filtered: VectorCandidate[] = []
	for (const candidate of mapped) {
		let providers = candidate.providerIds
		if (!providers.length) {
			providers = await ensureMovieProviders(candidate.tmdbId)
			candidate.providerIds = providers
		}
		if (overlapsProviders(providers, options.streamingServices)) {
			filtered.push(candidate)
		}
		if (filtered.length >= Math.max(limit * 2, 15)) break
	}

	return filtered
}

export const recommendationsRouter = router({
	getRecommendations: protectedProcedure
		.input(
			z.object({
				mood: z.string().trim().optional(),
				genre: z.string().trim().optional(),
				limit: z.number().int().min(1).max(20).default(10),
				watchableOnly: z.boolean().default(false),
			}),
		)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session.user.id
			const mood = input.mood?.trim() || "any"
			const genre = input.genre?.trim() || "any"
			const watchableOnly = input.watchableOnly
			const cacheKey = `recommendations:${userId}:${mood}:${genre}:${watchableOnly ? "stream" : "any"}`

			const cached = await redis.get(cacheKey)
			if (cached) {
				return JSON.parse(cached) as RecommendationResult[]
			}

			const [topRatedMovies, watchlist, userEmbedding, profile] = await Promise.all([
				db
					.select()
					.from(ratings)
					.where(and(eq(ratings.userId, userId), gte(ratings.rating, 7)))
					.orderBy(desc(ratings.rating), desc(ratings.updatedAt))
					.limit(20),
				db
					.select()
					.from(watchlists)
					.where(eq(watchlists.userId, userId))
					.orderBy(desc(watchlists.addedAt))
					.limit(50),
				getOrCreateUserEmbedding(userId),
				db.query.user.findFirst({
					where: eq(user.id, userId),
					columns: {
						streamingServices: true,
						hiddenVibes: true,
					},
				}),
			])

			const ratedTitles = topRatedMovies.map((movie) => movie.title).join(", ") || "none"
			const watchlistTitles = watchlist.map((movie) => movie.title).join(", ") || "none"
			const streamingServices = profile?.streamingServices ?? []
			const hiddenVibes = profile?.hiddenVibes ?? []
			const similarLiked = topRatedMovies.slice(0, 4).map((movie) => movie.title)

			let vectorCandidates: VectorCandidate[] = []
			if (userEmbedding) {
				try {
					const genreName = await resolveGenreFilterName(genre)
					vectorCandidates = await findVectorCandidates(userId, userEmbedding, input.limit, {
						genreFilter: genreName,
						streamingServices,
						watchableOnly: watchableOnly && streamingServices.length > 0,
					})
				} catch (error) {
					console.error("[recommendations] vector search failed", error)
					vectorCandidates = []
				}
			}

			const candidateBlock =
				vectorCandidates.length > 0
					? `Candidate movies (prefer these tmdbIds): ${vectorCandidates
							.map(
								(candidate) =>
									`${candidate.tmdbId}:${candidate.title} [${candidate.genres.join("/")}]`,
							)
							.join("; ")}`
					: "No vector candidates available; suggest well-known films matching the taste profile."

			const hideBlock =
				hiddenVibes.length > 0
					? `Avoid these vibes the user hid: ${hiddenVibes.join(", ")}.`
					: ""

			const prompt = `Based on these highly rated movies: ${ratedTitles}, and considering mood: ${mood} and genre preference: ${genre}, recommend ${input.limit} movies. Watchlist context: ${watchlistTitles}. ${candidateBlock} ${hideBlock} For each movie return: tmdbId (number), title, reason (why user would love it), score (0-1 confidence). Prefer candidates when provided. Return ONLY valid JSON array.`

			let recommendations: GeminiRecommendation[] = []
			let fallbackResult: RecommendationResult[] | null = null
			try {
				const generated = await generateContent(prompt)
				recommendations = parseRecommendations(generated).slice(0, input.limit)

				if (recommendations.length === 0) {
					if (vectorCandidates.length > 0) {
						recommendations = vectorCandidates.slice(0, input.limit).map((candidate, index) => ({
							tmdbId: candidate.tmdbId,
							title: candidate.title,
							reason:
								mood === "any"
									? "Close to your taste profile based on movies you've liked."
									: `Aligned with your ${mood} mood and viewing history.`,
							score: Math.max(0.55, 0.92 - index * 0.03 - candidate.distance * 0.1),
						}))
					} else {
						fallbackResult = await buildFallbackRecommendations(input.limit, mood, genre)
					}
				}
			} catch (error) {
				if (vectorCandidates.length > 0) {
					recommendations = vectorCandidates.slice(0, input.limit).map((candidate, index) => ({
						tmdbId: candidate.tmdbId,
						title: candidate.title,
						reason: "Recommended from your personal taste embedding.",
						score: Math.max(0.55, 0.9 - index * 0.03),
					}))
				} else {
					try {
						fallbackResult = await buildFallbackRecommendations(input.limit, mood, genre)
					} catch {
						if (error instanceof TRPCError) {
							throw error
						}

						throw new TRPCError({
							code: "BAD_GATEWAY",
							message: "Failed to generate recommendations",
							cause: error instanceof Error ? error : undefined,
						})
					}
				}
			}

			if (fallbackResult) {
				await redis.set(cacheKey, JSON.stringify(fallbackResult), "EX", 1800)
				return fallbackResult
			}

			const candidateMap = new Map(vectorCandidates.map((candidate) => [candidate.tmdbId, candidate]))

			const hydrated = await Promise.all(
				recommendations.map(async (recommendation) => {
					const cachedCandidate = candidateMap.get(recommendation.tmdbId)
					const providerIds =
						cachedCandidate?.providerIds?.length
							? cachedCandidate.providerIds
							: await ensureMovieProviders(recommendation.tmdbId)
					const availableOn = providerIds
						.filter((id) => streamingServices.length === 0 || streamingServices.includes(id))
						.map(providerName)
						.slice(0, 4)

					const suggestedHideVibes = [
						...(recommendation.reason.toLowerCase().includes("dark") ? ["dark / gritty"] : []),
						...(recommendation.reason.toLowerCase().includes("slow") ? ["slow burn"] : []),
						"this vibe",
					].slice(0, 3)

					try {
						const detail = await tmdb.get<TMDBMovieDetail>(`/movie/${recommendation.tmdbId}`)
						return {
							movie: toTMDBMovie(detail),
							reason: recommendation.reason,
							score: recommendation.score,
							availableOn,
							similarLiked,
							suggestedHideVibes,
						} satisfies RecommendationResult
					} catch {
						if (!cachedCandidate) {
							return null
						}

						return {
							movie: {
								id: cachedCandidate.tmdbId,
								title: cachedCandidate.title,
								overview: cachedCandidate.overview ?? "",
								poster_path: cachedCandidate.posterPath,
								backdrop_path: null,
								release_date: "",
								vote_average: 0,
								genre_ids: [],
							} satisfies TMDBMovie,
							reason: recommendation.reason,
							score: recommendation.score,
							availableOn,
							similarLiked,
							suggestedHideVibes,
						} satisfies RecommendationResult
					}
				}),
			)

			const result = hydrated.filter((item): item is NonNullable<typeof item> => item !== null)

			await redis.set(cacheKey, JSON.stringify(result), "EX", 1800)

			return result
		}),
})
