const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
	throw new Error("Missing GEMINI_API_KEY in environment variables")
}

type GeminiResponse = {
	candidates?: Array<{
		content?: {
			parts?: Array<{
				text?: string
			}>
		}
	}>
}

type GeminiEmbedResponse = {
	embedding?: {
		values?: number[]
	}
}

export type EmbedTaskType =
	| "RETRIEVAL_DOCUMENT"
	| "RETRIEVAL_QUERY"
	| "SEMANTIC_SIMILARITY"
	| "CLASSIFICATION"
	| "CLUSTERING"

export async function generateContent(prompt: string): Promise<string> {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [{ text: prompt }],
					},
				],
			}),
		},
	)

	if (!response.ok) {
		const details = await response.text()
		throw new Error(`Gemini API request failed: ${response.status} ${details}`)
	}

	const payload = (await response.json()) as GeminiResponse
	const text = payload.candidates?.[0]?.content?.parts?.[0]?.text

	if (!text) {
		throw new Error("Gemini response did not include generated text")
	}

	return text
}

const EMBEDDING_MODEL = "gemini-embedding-001"

export async function embedText(
	text: string,
	taskType: EmbedTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: `models/${EMBEDDING_MODEL}`,
				content: {
					parts: [{ text }],
				},
				taskType,
				outputDimensionality: 768,
			}),
		},
	)

	if (!response.ok) {
		const details = await response.text()
		throw new Error(`Gemini embed request failed: ${response.status} ${details}`)
	}

	const payload = (await response.json()) as GeminiEmbedResponse
	const values = payload.embedding?.values

	if (!values || values.length !== 768) {
		throw new Error(
			`Gemini embed response did not include a 768-d embedding (got ${values?.length ?? 0})`,
		)
	}

	return values
}
