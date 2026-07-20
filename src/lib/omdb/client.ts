export type RatingSource = {
	value: string
	score: number | null
}

export type ExternalRatings = {
	imdbId: string | null
	imdb: RatingSource | null
	rottenTomatoes: RatingSource | null
	metacritic: RatingSource | null
}

type OmdbRating = {
	Source: string
	Value: string
}

type OmdbResponse = {
	Response: "True" | "False"
	Error?: string
	imdbID?: string
	imdbRating?: string
	Metascore?: string
	Ratings?: OmdbRating[]
}

function parseScore(value: string | undefined): number | null {
	if (!value || value === "N/A") return null
	const match = value.match(/[\d.]+/)
	if (!match) return null
	const n = Number(match[0])
	return Number.isFinite(n) ? n : null
}

function fromRatings(ratings: OmdbRating[] | undefined, source: string): RatingSource | null {
	const entry = ratings?.find((r) => r.Source === source)
	if (!entry || !entry.Value || entry.Value === "N/A") return null
	return { value: entry.Value, score: parseScore(entry.Value) }
}

export function emptyExternalRatings(imdbId: string | null = null): ExternalRatings {
	return {
		imdbId,
		imdb: null,
		rottenTomatoes: null,
		metacritic: null,
	}
}

export async function fetchOmdbRatings(imdbId: string): Promise<ExternalRatings> {
	const apiKey = process.env.OMDB_API_KEY
	if (!apiKey) {
		return emptyExternalRatings(imdbId)
	}

	const url = new URL("https://www.omdbapi.com/")
	url.searchParams.set("i", imdbId)
	url.searchParams.set("apikey", apiKey)

	const res = await fetch(url.toString())
	if (!res.ok) {
		return emptyExternalRatings(imdbId)
	}

	const data = (await res.json()) as OmdbResponse
	if (data.Response !== "True") {
		if (process.env.NODE_ENV === "development") {
			console.warn(`[omdb] ${imdbId}: ${data.Error ?? "no data"}`)
		}
		return emptyExternalRatings(imdbId)
	}

	const imdbFromList = fromRatings(data.Ratings, "Internet Movie Database")
	const imdb =
		imdbFromList ??
		(data.imdbRating && data.imdbRating !== "N/A"
			? { value: `${data.imdbRating}/10`, score: parseScore(data.imdbRating) }
			: null)

	const rottenTomatoes = fromRatings(data.Ratings, "Rotten Tomatoes")

	const metacriticFromList = fromRatings(data.Ratings, "Metacritic")
	const metacritic =
		metacriticFromList ??
		(data.Metascore && data.Metascore !== "N/A"
			? { value: `${data.Metascore}/100`, score: parseScore(data.Metascore) }
			: null)

	return {
		imdbId: data.imdbID ?? imdbId,
		imdb,
		rottenTomatoes,
		metacritic,
	}
}
