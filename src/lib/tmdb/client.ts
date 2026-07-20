import axios from "axios"

import type {
  TMDBGenre,
  TMDBMovie,
  TMDBMovieDetail,
  TMDBPerson,
  TMDBResponse,
  TMDBVideo,
} from "@/lib/tmdb/types"

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

  getMovieExternalIds(id: number) {
    return tmdb.get<{ id: number; imdb_id: string | null }>(`/movie/${id}/external_ids`)
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

  discoverMovies(params: {
    page?: number
    sortBy?: string
    primaryReleaseDateGte?: string
    primaryReleaseDateLte?: string
    voteCountGte?: number
  }) {
    return tmdb.get<TMDBResponse<TMDBMovie>>("/discover/movie", {
      page: params.page ?? 1,
      sort_by: params.sortBy ?? "popularity.desc",
      "primary_release_date.gte": params.primaryReleaseDateGte,
      "primary_release_date.lte": params.primaryReleaseDateLte,
      "vote_count.gte": params.voteCountGte,
    })
  },

  getTrendingPeople(timeWindow: "day" | "week" = "week") {
    return tmdb.get<TMDBResponse<TMDBPerson>>(`/trending/person/${timeWindow}`)
  },

  getPopularPeople(page = 1) {
    return tmdb.get<TMDBResponse<TMDBPerson>>("/person/popular", { page })
  },

  getWatchProviders(region = "US") {
    return tmdb.get<{
      results: Array<{ provider_id: number; provider_name: string; logo_path: string | null }>
    }>("/watch/providers/movie", { watch_region: region })
  },

  getMovieWatchProviders(movieId: number) {
    return tmdb.get<{
      results: Record<
        string,
        {
          link?: string
          flatrate?: Array<{ provider_id: number; provider_name: string }>
          rent?: Array<{ provider_id: number; provider_name: string }>
          buy?: Array<{ provider_id: number; provider_name: string }>
        }
      >
    }>(`/movie/${movieId}/watch/providers`)
  },

  getImageUrl(path: string, size: "w200" | "w500" | "w780" | "original" = "w500") {
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  },
}
