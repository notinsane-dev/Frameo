import type { MetadataRoute } from "next"

import { tmdb } from "@/lib/tmdb/client"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  let trendingResults: Awaited<ReturnType<typeof tmdb.getTrending>>["results"] = []

  try {
    const trending = await tmdb.getTrending()
    trendingResults = trending.results.slice(0, 20)
  } catch {
    trendingResults = []
  }

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/recommendations`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/friends`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    ...trendingResults.map((movie) => ({
      url: `${baseUrl}/movie/${movie.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
