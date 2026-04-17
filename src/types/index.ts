import type { TMDBMovie } from "@/lib/tmdb/types"

export interface WatchlistItem {
  movieId: number
  title: string
  poster: string
  addedAt: string
}

export interface UserRating {
  movieId: number
  rating: number
  review?: string
  createdAt: string
}

export interface RecommendationResult {
  movie: TMDBMovie
  reason: string
  score: number
}
