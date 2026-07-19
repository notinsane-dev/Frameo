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
