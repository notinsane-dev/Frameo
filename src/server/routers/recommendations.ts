import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { connectDB } from "@/lib/db/mongoose"
import { redis } from "@/lib/db/redis"
import { generateContent } from "@/lib/gemini/client"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie, TMDBMovieDetail } from "@/lib/tmdb/types"
import RatingModel from "@/models/Rating"
import WatchlistModel from "@/models/Watchlist"
import { protectedProcedure, router } from "@/server/trpc"
import type { RecommendationResult } from "@/types"

type GeminiRecommendation = {
	tmdbId: number
	title: string
	reason: string
	score: number
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

export const recommendationsRouter = router({
	getRecommendations: protectedProcedure
		.input(
			z.object({
				mood: z.string().trim().optional(),
				genre: z.string().trim().optional(),
				limit: z.number().int().min(1).max(20).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			await connectDB()

			const userId = ctx.session.user.id
			const mood = input.mood?.trim() || "any"
			const genre = input.genre?.trim() || "any"
			const cacheKey = `recommendations:${userId}:${mood}:${genre}`

			const cached = await redis.get(cacheKey)
			if (cached) {
				return JSON.parse(cached) as RecommendationResult[]
			}

			const [topRatedMovies, watchlist] = await Promise.all([
				RatingModel.find({ userId, rating: { $gte: 7 } })
					.sort({ rating: -1, updatedAt: -1 })
					.limit(20)
					.lean(),
				WatchlistModel.find({ userId }).sort({ addedAt: -1 }).limit(50).lean(),
			])

			const ratedTitles = topRatedMovies.map((movie) => movie.title).join(", ") || "none"
			const watchlistTitles = watchlist.map((movie) => movie.title).join(", ") || "none"

			const prompt = `Based on these highly rated movies: ${ratedTitles}, and considering mood: ${mood} and genre preference: ${genre}, recommend ${input.limit} movies. Watchlist context: ${watchlistTitles}. For each movie return: tmdbId (number), title, reason (why user would love it), score (0-1 confidence). Return ONLY valid JSON array.`

			let recommendations: GeminiRecommendation[] = []
			let fallbackResult: RecommendationResult[] | null = null
			try {
				const generated = await generateContent(prompt)
				recommendations = parseRecommendations(generated).slice(0, input.limit)

				if (recommendations.length === 0) {
					fallbackResult = await buildFallbackRecommendations(input.limit, mood, genre)
				}
			} catch (error) {
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

			if (fallbackResult) {
				await redis.set(cacheKey, JSON.stringify(fallbackResult), "EX", 1800)
				return fallbackResult
			}

			const hydrated = await Promise.all(
				recommendations.map(async (recommendation) => {
					try {
						const detail = await tmdb.get<TMDBMovieDetail>(`/movie/${recommendation.tmdbId}`)
						return {
							movie: toTMDBMovie(detail),
							reason: recommendation.reason,
							score: recommendation.score,
						} satisfies RecommendationResult
					} catch {
						return null
					}
				}),
			)

			const result = hydrated.filter((item): item is RecommendationResult => item !== null)

			await redis.set(cacheKey, JSON.stringify(result), "EX", 1800)

			return result
		}),
})
