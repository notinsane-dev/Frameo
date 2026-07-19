import axios from "axios"

import type { TMDBGenre, TMDBMovie, TMDBMovieDetail, TMDBResponse, TMDBVideo } from "@/lib/tmdb/types"

const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3"
const TMDB_API_KEY = process.env.TMDB_API_KEY

const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: TMDB_API_KEY ? { api_key: TMDB_API_KEY } : undefined,
})

type QueryParams = Record<string, string | number | boolean | undefined>

const TMDB_IMAGE_BASE =
  process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || process.env.TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p"

export const tmdb = {
  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    const response = await tmdbClient.get<T>(endpoint, { params })
    return response.data
  },

  getTrending() {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/trending/movie/week")
  },

  getPopular(page = 1) {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/movie/popular", { page })
  },

  getTopRated(page = 1) {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/movie/top_rated", { page })
  },

  searchMovies(query: string, page = 1) {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/search/movie", { query, page })
  },

  getMovieById(id: number) {
    return tmdb.get<TMDBMovieDetail>(`/movie/${id}`, {
      append_to_response: "videos,credits,similar",
    })
  },

  getMovieVideos(id: number) {
    return tmdb.get<{ id: number; results: TMDBVideo[] }>(`/movie/${id}/videos`)
  },

  getGenres() {
    return tmdb.get<{ genres: TMDBGenre[] }>("/genre/movie/list")
  },

  getByGenre(genreId: number, page = 1) {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/discover/movie", {
      with_genres: genreId,
      page,
    })
  },

  getImageUrl(path: string, size: "w200" | "w500" | "w780" | "original" = "w500") {
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  },
}
