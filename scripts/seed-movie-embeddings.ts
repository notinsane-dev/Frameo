/**
 * Seed popular/trending TMDB movies into Supabase with Gemini embeddings.
 *
 * Usage: npm run db:seed-embeddings
 */
import type { TMDBMovie } from "../src/lib/tmdb/types"
import { tmdb } from "../src/lib/tmdb/client"
import { upsertMovieFromTmdbMovie } from "../src/lib/embeddings/movies"

const PAGES = Number(process.env.SEED_PAGES || 3)
const MAX_RETRIES = 4

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown) {
	if (!(error instanceof Error)) return true
	const message = error.message.toLowerCase()
	if (message.includes(" 404 ") || message.includes("not found")) return false
	if (message.includes(" 400 ") || message.includes(" 401 ") || message.includes(" 403 ")) {
		return false
	}
	return (
		message.includes("econnreset") ||
		message.includes("etimedout") ||
		message.includes("econnrefused") ||
		message.includes("socket") ||
		message.includes(" 429 ") ||
		message.includes(" 500 ") ||
		message.includes(" 502 ") ||
		message.includes(" 503 ")
	)
}

async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
	let lastError: unknown

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
		try {
			return await fn()
		} catch (error) {
			lastError = error
			if (!isRetryableError(error) || attempt === MAX_RETRIES) {
				throw error
			}
			const delay = attempt * 1000
			console.warn(
				`Retry ${attempt}/${MAX_RETRIES} for ${label} in ${delay}ms:`,
				error instanceof Error ? error.message : error,
			)
			await sleep(delay)
		}
	}

	throw lastError
}

async function main() {
	console.log(`Seeding movie embeddings from TMDB (popular + trending, ${PAGES} pages)...`)

	const seen = new Set<number>()
	let embedded = 0
	let failed = 0

	for (let page = 1; page <= PAGES; page += 1) {
		let batch: TMDBMovie[] = []

		try {
			const popular = await withRetry(`popular page ${page}`, () => tmdb.getPopular(page))
			batch = [...popular.results]
		} catch (error) {
			console.error(
				`Failed to fetch popular page ${page}:`,
				error instanceof Error ? error.message : error,
			)
		}

		if (page === 1) {
			try {
				const trending = await withRetry("trending", () => tmdb.getTrending())
				batch = [...batch, ...trending.results]
			} catch (error) {
				console.error(
					"Failed to fetch trending (continuing with popular only):",
					error instanceof Error ? error.message : error,
				)
			}
		}

		for (const movie of batch) {
			if (seen.has(movie.id)) continue
			seen.add(movie.id)

			try {
				await withRetry(`embed ${movie.id}`, () => upsertMovieFromTmdbMovie(movie))
				embedded += 1
				console.log(`✓ ${movie.id} ${movie.title}`)
			} catch (error) {
				failed += 1
				console.error(
					`✗ ${movie.id} ${movie.title}`,
					error instanceof Error ? error.message : error,
				)
			}

			await sleep(250)
		}
	}

	console.log(`Done. Embedded=${embedded} failed=${failed} unique=${seen.size}`)
	process.exit(embedded === 0 ? 1 : 0)
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})
