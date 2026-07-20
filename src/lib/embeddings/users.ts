import { and, eq, gte, inArray, isNotNull } from "drizzle-orm"

import { db } from "@/lib/db"
import { movies, ratings, userEmbeddings, watchlists } from "@/lib/db/schema"
import { ensureMovieEmbedded } from "@/lib/embeddings/movies"
import { invalidateRecommendationCache } from "@/lib/recommendations/cache"

function averageWeightedEmbeddings(
	items: Array<{ embedding: number[]; weight: number }>,
): number[] | null {
	if (items.length === 0) {
		return null
	}

	const dimensions = items[0].embedding.length
	const result = new Array<number>(dimensions).fill(0)
	let totalWeight = 0

	for (const item of items) {
		if (item.embedding.length !== dimensions || item.weight <= 0) {
			continue
		}
		totalWeight += item.weight
		for (let i = 0; i < dimensions; i += 1) {
			result[i] += item.embedding[i] * item.weight
		}
	}

	if (totalWeight <= 0) {
		return null
	}

	for (let i = 0; i < dimensions; i += 1) {
		result[i] /= totalWeight
	}

	let norm = 0
	for (const value of result) {
		norm += value * value
	}
	norm = Math.sqrt(norm)
	if (norm > 0) {
		for (let i = 0; i < dimensions; i += 1) {
			result[i] /= norm
		}
	}

	return result
}

export async function recomputeUserEmbedding(userId: string) {
	const [userRatings, userWatchlist] = await Promise.all([
		db
			.select()
			.from(ratings)
			.where(and(eq(ratings.userId, userId), gte(ratings.rating, 5)))
			.orderBy(ratings.rating),
		db.select().from(watchlists).where(eq(watchlists.userId, userId)),
	])

	const ratedMovieIds = new Set(userRatings.map((rating) => rating.movieId))
	const movieIds = Array.from(
		new Set([...ratedMovieIds, ...userWatchlist.map((item) => item.movieId)]),
	)

	if (movieIds.length === 0) {
		await db.delete(userEmbeddings).where(eq(userEmbeddings.userId, userId))
		return null
	}

	await Promise.all(
		movieIds.map(async (movieId) => {
			try {
				await ensureMovieEmbedded(movieId)
			} catch (error) {
				console.error(`[embeddings] failed to embed movie ${movieId}`, error)
			}
		}),
	)

	const movieRows = await db
		.select()
		.from(movies)
		.where(and(inArray(movies.tmdbId, movieIds), isNotNull(movies.embedding)))

	const movieMap = new Map(movieRows.map((movie) => [movie.tmdbId, movie]))
	const weighted: Array<{ embedding: number[]; weight: number }> = []

	for (const rating of userRatings) {
		const movie = movieMap.get(rating.movieId)
		if (!movie?.embedding) continue
		weighted.push({
			embedding: movie.embedding,
			weight: Math.max(0.1, rating.rating / 10),
		})
	}

	// Watchlist-only titles (skip already-rated to avoid double-counting)
	for (const item of userWatchlist) {
		if (ratedMovieIds.has(item.movieId)) continue
		const movie = movieMap.get(item.movieId)
		if (!movie?.embedding) continue
		weighted.push({
			embedding: movie.embedding,
			weight: 0.6,
		})
	}

	const embedding = averageWeightedEmbeddings(weighted)
	if (!embedding) {
		await db.delete(userEmbeddings).where(eq(userEmbeddings.userId, userId))
		return null
	}

	const now = new Date()
	await db
		.insert(userEmbeddings)
		.values({
			userId,
			embedding,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: userEmbeddings.userId,
			set: {
				embedding,
				updatedAt: now,
			},
		})

	return embedding
}

export async function getOrCreateUserEmbedding(userId: string) {
	const existing = await db.query.userEmbeddings.findFirst({
		where: eq(userEmbeddings.userId, userId),
	})

	if (existing?.embedding) {
		return existing.embedding
	}

	return recomputeUserEmbedding(userId)
}

/** Recompute taste vector and bust recommendation cache. Logs failures. */
export async function refreshUserTaste(userId: string) {
	try {
		await recomputeUserEmbedding(userId)
		await invalidateRecommendationCache(userId)
	} catch (error) {
		console.error(`[embeddings] refreshUserTaste failed for ${userId}`, error)
	}
}
