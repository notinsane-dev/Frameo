import axios from "axios"

export const tmdbClient = axios.create({
  baseURL: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
  params: {
    api_key: process.env.TMDB_API_KEY,
  },
})
