export interface TMDBGenre {
  id: number
  name: string
}

export interface TMDBVideo {
  id: string
  key: string
  site: string
  type: string
  official: boolean
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}

export interface TMDBCrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path: string | null
}

export interface TMDBCredits {
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export interface TMDBResponse<T> {
  results: T[]
  total_pages: number
  total_results: number
  page: number
}

export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count?: number
  genre_ids: number[]
  genres?: TMDBGenre[]
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number
  tagline: string
  status: string
  budget: number
  revenue: number
  genres: TMDBGenre[]
  videos: {
    results: TMDBVideo[]
  }
  credits: TMDBCredits
  similar: TMDBResponse<TMDBMovie>
}
