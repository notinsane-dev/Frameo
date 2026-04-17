export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  genres?: TMDBGenre[]
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number
  tagline: string
  production_companies: Array<{
    id: number
    name: string
    logo_path: string | null
    origin_country: string
  }>
  videos: {
    results: Array<{
      id: string
      key: string
      name: string
      site: string
      type: string
      official: boolean
    }>
  }
  credits: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path: string | null
    }>
    crew: Array<{
      id: number
      name: string
      job: string
      department: string
      profile_path: string | null
    }>
  }
}

export interface TMDBResponse<T> {
  results: T[]
  total_pages: number
  total_results: number
  page: number
}
