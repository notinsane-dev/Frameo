import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { movies } from "@/lib/db/schema"
import { embedText } from "@/lib/gemini/client"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie, TMDBMovieDetail } from "@/lib/tmdb/types"

let genreIdToNameCache: Map<number, string> | null = null

async function getGenreIdToNameMap() {
	if (genreIdToNameCache) {
		return genreIdToNameCache
	}

	const { genres } = await tmdb.getGenres()
	genreIdToNameCache = new Map(genres.map((genre) => [genre.id, genre.name]))
	return genreIdToNameCache
}

function buildMovieEmbedText(input: {
	title: string
	overview?: string | null
	genres?: string[]
}) {
	const genres = input.genres?.length ? input.genres.join(", ") : "Unknown"
	const overview = input.overview?.trim() || "No overview available"
	return `Title: ${input.title}\nGenres: ${genres}\nOverview: ${overview}`
}

function genresFromDetail(detail: TMDBMovieDetail): string[] {
	return detail.genres?.map((genre) => genre.name).filter(Boolean) ?? []
}

export async function resolveMovieGenres(movie: TMDBMovie): Promise<string[]> {
	if (movie.genres?.length) {
		return movie.genres.map((genre) => genre.name).filter(Boolean)
	}

	if (movie.genre_ids?.length) {
		const map = await getGenreIdToNameMap()
		return movie.genre_ids.map((id) => map.get(id)).filter((name): name is string => Boolean(name))
	}

	return []
}

function needsReembed(existing: {
	embedding: number[] | null
	genres: string[] | null
	overview: string | null
}) {
	if (!existing.embedding) return true
	if (!existing.genres?.length) return true
	if (!existing.overview?.trim()) return true
	return false
}

export async function upsertMovieEmbedding(input: {
	tmdbId: number
	title: string
	overview?: string | null
	genres?: string[]
	posterPath?: string | null
}) {
	const genres = input.genres ?? []
	const embedding = await embedText(
		buildMovieEmbedText({
			title: input.title,
			overview: input.overview,
			genres,
		}),
		"RETRIEVAL_DOCUMENT",
	)

	const now = new Date()

	const conflictSet: {
		title: string
		overview?: string | null
		genres?: string[]
		posterPath?: string | null
		embedding: number[]
		embeddedAt: Date
		updatedAt: Date
	} = {
		title: input.title,
		embedding,
		embeddedAt: now,
		updatedAt: now,
	}

	if (input.overview) {
		conflictSet.overview = input.overview
	}
	if (genres.length > 0) {
		conflictSet.genres = genres
	}
	if (input.posterPath) {
		conflictSet.posterPath = input.posterPath
	}

	await db
		.insert(movies)
		.values({
			tmdbId: input.tmdbId,
			title: input.title,
			overview: input.overview ?? null,
			genres,
			posterPath: input.posterPath ?? null,
			embedding,
			embeddedAt: now,
			createdAt: now,
			updatedAt: now,
		})
		.onConflictDoUpdate({
			target: movies.tmdbId,
			set: conflictSet,
		})

	return embedding
}

export async function ensureMovieEmbedded(tmdbId: number) {
	const existing = await db.query.movies.findFirst({
		where: eq(movies.tmdbId, tmdbId),
	})

	if (existing && !needsReembed(existing)) {
		return existing
	}

	const detail = await tmdb.getMovieById(tmdbId)
	await upsertMovieEmbedding({
		tmdbId: detail.id,
		title: detail.title,
		overview: detail.overview,
		genres: genresFromDetail(detail),
		posterPath: detail.poster_path,
	})

	return db.query.movies.findFirst({
		where: eq(movies.tmdbId, tmdbId),
	})
}

export async function ensureMovieEmbeddedFromMetadata(input: {
	tmdbId: number
	title: string
	overview?: string | null
	poster?: string | null
}) {
	const existing = await db.query.movies.findFirst({
		where: eq(movies.tmdbId, input.tmdbId),
	})

	if (existing && !needsReembed(existing)) {
		return existing
	}

	try {
		const detail = await tmdb.getMovieById(input.tmdbId)
		await upsertMovieEmbedding({
			tmdbId: detail.id,
			title: detail.title || input.title,
			overview: detail.overview || input.overview,
			genres: genresFromDetail(detail),
			posterPath: detail.poster_path || input.poster,
		})
	} catch {
		// Only write a sparse row if we have nothing yet
		if (!existing?.embedding) {
			await upsertMovieEmbedding({
				tmdbId: input.tmdbId,
				title: input.title,
				overview: input.overview,
				genres: existing?.genres ?? [],
				posterPath: input.poster,
			})
		}
	}

	return db.query.movies.findFirst({
		where: eq(movies.tmdbId, input.tmdbId),
	})
}

export async function upsertMovieFromTmdbMovie(movie: TMDBMovie) {
	const genres = await resolveMovieGenres(movie)

	// Prefer detail when list payload has no genre names
	if (!genres.length) {
		try {
			const detail = await tmdb.getMovieById(movie.id)
			return upsertMovieEmbedding({
				tmdbId: detail.id,
				title: detail.title || movie.title,
				overview: detail.overview || movie.overview,
				genres: genresFromDetail(detail),
				posterPath: detail.poster_path || movie.poster_path,
			})
		} catch {
			// fall through with empty genres
		}
	}

	return upsertMovieEmbedding({
		tmdbId: movie.id,
		title: movie.title,
		overview: movie.overview,
		genres,
		posterPath: movie.poster_path,
	})
}

export async function resolveGenreFilterName(genreFilter?: string) {
	if (!genreFilter || genreFilter === "any") {
		return undefined
	}

	const asId = Number(genreFilter)
	if (Number.isInteger(asId) && asId > 0) {
		const map = await getGenreIdToNameMap()
		return map.get(asId)
	}

	return genreFilter
}
