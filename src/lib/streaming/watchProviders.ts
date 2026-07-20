import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { movies } from "@/lib/db/schema"
import { tmdb } from "@/lib/tmdb/client"

const DEFAULT_REGION = process.env.TMDB_WATCH_REGION || "US"

export async function fetchMovieProviderIds(
	movieId: number,
	region = DEFAULT_REGION,
): Promise<string[]> {
	try {
		const payload = await tmdb.getMovieWatchProviders(movieId)
		const regional = payload.results?.[region]
		if (!regional) return []

		const ids = new Set<string>()
		for (const entry of [...(regional.flatrate ?? []), ...(regional.rent ?? [])]) {
			ids.add(String(entry.provider_id))
		}
		return Array.from(ids)
	} catch {
		return []
	}
}

export async function ensureMovieProviders(movieId: number) {
	const existing = await db.query.movies.findFirst({
		where: eq(movies.tmdbId, movieId),
		columns: { tmdbId: true, providerIds: true },
	})

	if (existing?.providerIds?.length) {
		return existing.providerIds
	}

	const providerIds = await fetchMovieProviderIds(movieId)
	if (!existing) {
		return providerIds
	}

	if (providerIds.length > 0) {
		await db
			.update(movies)
			.set({ providerIds, updatedAt: new Date() })
			.where(eq(movies.tmdbId, movieId))
	}

	return providerIds
}

export function overlapsProviders(movieProviders: string[], userProviders: string[]) {
	if (userProviders.length === 0) return true
	if (movieProviders.length === 0) return false
	const userSet = new Set(userProviders)
	return movieProviders.some((id) => userSet.has(id))
}
