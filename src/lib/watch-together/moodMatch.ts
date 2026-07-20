/** Maps session moods → genres + retrieval query used for shortlist ranking. */

const PRESET_MOOD_TARGETS: Record<
	string,
	{ genres: string[]; query: string }
> = {
	cozy: {
		genres: ["Comedy", "Romance", "Family", "Animation", "Fantasy"],
		query:
			"cozy feel-good movie night, warm comedy, gentle romance, comforting low-stakes stories",
	},
	laughs: {
		genres: ["Comedy"],
		query: "funny comedy movie night, laughs, witty humor, light entertainment",
	},
	thrills: {
		genres: ["Thriller", "Action", "Horror", "Crime", "Mystery"],
		query: "thrilling suspenseful movie night, tension, edge-of-seat thriller",
	},
	romance: {
		genres: ["Romance", "Drama", "Comedy"],
		query: "romantic movie night, love story, chemistry, emotional romance",
	},
	"mind-benders": {
		genres: ["Science Fiction", "Mystery", "Thriller", "Drama"],
		query:
			"mind-bending cerebral movie, twists, mystery, sci-fi puzzle, psychological intrigue",
	},
	"crowd-pleaser": {
		genres: ["Action", "Adventure", "Comedy", "Science Fiction", "Fantasy"],
		query: "crowd-pleasing blockbuster, fun accessible movie everyone can enjoy",
	},
}

const KEYWORD_GENRES: Array<{ match: RegExp; genres: string[]; hint: string }> = [
	{
		match: /\b(horror|scary|spooky|slashers?|ghosts?|supernatural)\b/i,
		genres: ["Horror"],
		hint: "horror scary supernatural",
	},
	{
		match: /\b(thrill|thrills|thriller|suspense|tense|tension)\b/i,
		genres: ["Thriller"],
		hint: "thriller suspense tension",
	},
	{
		match: /\b(traumatic|trauma|psychological|disturbing|dark|intense|gritty)\b/i,
		genres: ["Thriller", "Drama", "Horror"],
		hint: "psychological dark intense traumatic drama",
	},
	{
		match: /\b(comedy|laugh|funny|humou?r)\b/i,
		genres: ["Comedy"],
		hint: "comedy funny",
	},
	{
		match: /\b(romance|romantic|love)\b/i,
		genres: ["Romance"],
		hint: "romance love story",
	},
	{
		match: /\b(action|explosive|heist)\b/i,
		genres: ["Action"],
		hint: "action adventure",
	},
	{
		match: /\b(sci-?fi|science fiction|futuristic)\b/i,
		genres: ["Science Fiction"],
		hint: "science fiction",
	},
	{
		match: /\b(mystery|whodunnit|detective)\b/i,
		genres: ["Mystery"],
		hint: "mystery detective",
	},
	{
		match: /\b(cozy|comfort|feel[- ]?good|wholesome)\b/i,
		genres: ["Comedy", "Romance", "Family"],
		hint: "cozy feel-good comfort",
	},
	{
		match: /\b(mind[- ]?bend|twist|cerebral|puzzle)\b/i,
		genres: ["Science Fiction", "Mystery", "Thriller"],
		hint: "mind-bending twists",
	},
]

export type MoodTargets = {
	genres: string[]
	queryText: string
	labels: string[]
}

function unique(values: string[]) {
	return Array.from(new Set(values.filter(Boolean)))
}

export function resolveMoodTargets(moods: Array<string | null | undefined>): MoodTargets {
	const labels = unique(
		moods.map((mood) => mood?.trim()).filter((mood): mood is string => Boolean(mood)),
	)

	if (labels.length === 0) {
		return {
			genres: [],
			queryText: "group movie night picks that work for mixed tastes",
			labels: [],
		}
	}

	const genres: string[] = []
	const queryParts: string[] = []

	for (const label of labels) {
		const key = label.toLowerCase()
		const preset = PRESET_MOOD_TARGETS[key]
		if (preset) {
			genres.push(...preset.genres)
			queryParts.push(preset.query)
			continue
		}

		let matchedKeyword = false
		for (const rule of KEYWORD_GENRES) {
			if (rule.match.test(label)) {
				genres.push(...rule.genres)
				queryParts.push(rule.hint)
				matchedKeyword = true
			}
		}

		if (!matchedKeyword) {
			queryParts.push(label)
		}
	}

	const uniqueGenres = unique(genres)
	const queryText = [
		`Group movie night mood: ${labels.join(", ")}.`,
		uniqueGenres.length ? `Prefer genres: ${uniqueGenres.join(", ")}.` : "",
		`Vibe: ${queryParts.join("; ")}.`,
		"Pick films that clearly match this mood, not generic popular titles.",
	]
		.filter(Boolean)
		.join(" ")

	return { genres: uniqueGenres, queryText, labels }
}

export function moodGenreFit(movieGenres: string[] | null | undefined, targets: MoodTargets) {
	if (!targets.genres.length) return 0.5
	const genres = (movieGenres ?? []).map((genre) => genre.toLowerCase())
	if (genres.length === 0) return 0.15

	const hits = targets.genres.filter((target) =>
		genres.some((genre) => genre === target.toLowerCase()),
	).length

	return Math.min(1, hits / Math.min(2, targets.genres.length))
}

/** Blend two unit-ish vectors; moodWeight controls how strongly mood pulls results. */
export function blendEmbeddings(
	taste: number[],
	mood: number[],
	moodWeight = 0.65,
): number[] {
	const tasteWeight = 1 - moodWeight
	const dims = Math.min(taste.length, mood.length)
	const out = new Array<number>(dims).fill(0)

	for (let i = 0; i < dims; i += 1) {
		out[i] = taste[i] * tasteWeight + mood[i] * moodWeight
	}

	let norm = 0
	for (const value of out) norm += value * value
	norm = Math.sqrt(norm)
	if (norm > 0) {
		for (let i = 0; i < dims; i += 1) out[i] /= norm
	}
	return out
}

export function rankByMoodAndTaste<T extends { distance: unknown; genres?: string[] | null }>(
	rows: T[],
	targets: MoodTargets,
) {
	return [...rows]
		.map((row) => {
			const tasteScore = Math.max(0, 1 - Number(row.distance))
			const genreScore = moodGenreFit(row.genres, targets)
			const score =
				targets.genres.length > 0
					? tasteScore * 0.35 + genreScore * 0.65
					: tasteScore
			return { row, score, genreScore, tasteScore }
		})
		.sort((a, b) => b.score - a.score)
}
