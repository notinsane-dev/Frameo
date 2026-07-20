import { redis } from "@/lib/db/redis"
import { emptyExternalRatings, fetchOmdbRatings, type ExternalRatings } from "@/lib/omdb/client"
import { tmdb } from "@/lib/tmdb/client"

function hasAnyRating(ratings: ExternalRatings): boolean {
	return Boolean(ratings.imdb || ratings.rottenTomatoes || ratings.metacritic)
}

async function readCache(key: string): Promise<ExternalRatings | null> {
	try {
		const cached = await redis.get(key)
		if (!cached) return null
		return JSON.parse(cached) as ExternalRatings
	} catch {
		return null
	}
}

async function writeCache(key: string, ratings: ExternalRatings): Promise<void> {
	if (!hasAnyRating(ratings)) return
	try {
		await redis.set(key, JSON.stringify(ratings), "EX", 86400)
	} catch {
		// Cache is best-effort; ratings still return.
	}
}

export async function getMovieExternalRatings(movieId: number): Promise<ExternalRatings> {
	if (!process.env.OMDB_API_KEY) {
		return emptyExternalRatings()
	}

	const cacheKey = `omdb:ratings:${movieId}`
	const cached = await readCache(cacheKey)
	if (cached && hasAnyRating(cached)) {
		return cached
	}

	try {
		const external = await tmdb.getMovieExternalIds(movieId)
		const imdbId = external.imdb_id
		if (!imdbId) {
			return emptyExternalRatings()
		}

		const ratings = await fetchOmdbRatings(imdbId)
		await writeCache(cacheKey, ratings)
		return ratings
	} catch {
		return emptyExternalRatings()
	}
}
