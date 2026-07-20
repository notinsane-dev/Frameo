import { tmdb } from "@/lib/tmdb/client"
import { FALLBACK_GENRES, FALLBACK_MOVIES } from "@/lib/tmdb/fallbacks"
import { HeroSection } from "@/components/home/HeroSection"
import { TrendingSection } from "@/components/home/TrendingSection"
import { GenreShowcase } from "@/components/home/GenreShowcase"
import { FeaturedSection } from "@/components/home/FeaturedSection"
import { AIPromoBanner } from "@/components/home/AIPromoBanner"
import { PopularReviewsSection } from "@/components/home/PopularReviewsSection"

export default async function HomePage() {
  const [trendingResult, popularResult, topRatedResult, genresResult] = await Promise.allSettled([
    tmdb.getTrending(),
    tmdb.getPopular(),
    tmdb.getTopRated(),
    tmdb.getGenres(),
  ])

  const trendingMovies =
    trendingResult.status === "fulfilled" ? trendingResult.value.results || [] : []
  const popularMovies = popularResult.status === "fulfilled" ? popularResult.value.results || [] : []
  const topRatedMovies =
    topRatedResult.status === "fulfilled" ? topRatedResult.value.results || [] : []
  const genres = genresResult.status === "fulfilled" ? genresResult.value.genres || [] : []

  const aggregatedMovies = [...trendingMovies, ...popularMovies, ...topRatedMovies]
  const uniqueMovies = aggregatedMovies.filter(
    (movie, index, all) => all.findIndex((item) => item.id === movie.id) === index,
  )
  const moviesWithPosters = uniqueMovies.filter((movie) => Boolean(movie.poster_path))
  const moviesWithBackdrops = uniqueMovies.filter((movie) => Boolean(movie.backdrop_path))

  const heroMovies =
    trendingMovies.length > 0
      ? trendingMovies.slice(0, 5)
      : moviesWithBackdrops.length > 0
        ? moviesWithBackdrops.slice(0, 5)
        : FALLBACK_MOVIES
  const trendingList =
    trendingMovies.length > 0
      ? trendingMovies.slice(0, 10)
      : moviesWithPosters.length > 0
        ? moviesWithPosters.slice(0, 10)
        : FALLBACK_MOVIES
  const popularList =
    popularMovies.length > 0
      ? popularMovies
      : moviesWithPosters.length > 0
        ? moviesWithPosters
        : FALLBACK_MOVIES
  const topRatedList = topRatedMovies.length > 0 ? topRatedMovies : FALLBACK_MOVIES
  const genreList = genres.length > 0 ? genres : FALLBACK_GENRES
  const promoMovies =
    trendingMovies.length > 5
      ? trendingMovies.slice(5, 9)
      : moviesWithPosters.length > 0
        ? moviesWithPosters.slice(0, 4)
        : FALLBACK_MOVIES.slice(0, 4)

  return (
    <div className="bg-[var(--color-ink)]">
      <HeroSection movies={heroMovies} />
      <main>
        <TrendingSection movies={trendingList} />
        <PopularReviewsSection />
        <FeaturedSection
          title="Popular right now"
          subtitle="What people are locking in tonight"
          movies={popularList}
        />
        <GenreShowcase genres={genreList} />
        <FeaturedSection
          title="Critically locked"
          subtitle="Top-rated frames worth your time"
          movies={topRatedList}
        />
        <AIPromoBanner movies={promoMovies} />
      </main>
    </div>
  )
}
