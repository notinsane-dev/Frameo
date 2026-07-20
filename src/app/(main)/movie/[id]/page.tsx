import type { Metadata } from "next"
import { cache } from "react"
import Image from "next/image"

import { CastSection } from "@/components/movie/CastSection"
import { MovieCarousel } from "@/components/movie/MovieCarousel"
import { MovieHero } from "@/components/movie/MovieHero"
import { MovieRatings } from "@/components/movie/MovieRatings"
import { MovieReviewsSection } from "@/components/reviews/MovieReviewsSection"
import { getMovieExternalRatings } from "@/lib/omdb/getMovieExternalRatings"
import { tmdb } from "@/lib/tmdb/client"

type MovieDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getMovieById = cache(async (id: number) => {
  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await tmdb.getMovieById(id)
    } catch (error) {
      lastError = error

      if (attempt < 3) {
        await wait(attempt * 250)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch movie")
})

export async function generateMetadata({ params }: MovieDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const movieId = Number(id)

  if (!Number.isFinite(movieId) || movieId <= 0) {
    return {
      title: "Movie",
      description: "Movie details",
    }
  }

  try {
    const movie = await getMovieById(movieId)

    return {
      title: movie.title,
      description: movie.overview,
      openGraph: {
        title: movie.title,
        description: movie.overview,
        images: movie.backdrop_path ? [tmdb.getImageUrl(movie.backdrop_path, "w780")] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: movie.title,
        description: movie.overview,
        images: movie.backdrop_path ? [tmdb.getImageUrl(movie.backdrop_path, "w780")] : [],
      },
    }
  } catch {
    return {
      title: "Movie",
      description: "Explore movies on Frameo",
    }
  }
}

function UnavailableState({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 text-center">
      <Image
        src="/frameo.webp"
        alt="Frameo"
        width={120}
        height={90}
        className="h-14 w-auto object-contain"
      />
      <h1 className="font-heading text-4xl font-bold tracking-tight text-[var(--color-text)]">
        Movie unavailable
      </h1>
      <p className="max-w-xl text-[var(--color-text-secondary)]">{message}</p>
    </div>
  )
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params
  const movieId = Number(id)

  if (!Number.isFinite(movieId) || movieId <= 0) {
    return <UnavailableState message="The requested movie id is invalid." />
  }

  let movie

  try {
    movie = await getMovieById(movieId)
  } catch {
    movie = null
  }

  if (!movie) {
    return (
      <UnavailableState message="We could not load this movie right now. Please try again later." />
    )
  }

  const details = [
    movie.runtime ? { label: "Runtime", value: `${movie.runtime} min` } : null,
    movie.release_date ? { label: "Released", value: movie.release_date } : null,
    movie.status ? { label: "Status", value: movie.status } : null,
    movie.budget > 0
      ? { label: "Budget", value: `$${movie.budget.toLocaleString()}` }
      : null,
    movie.revenue > 0
      ? { label: "Revenue", value: `$${movie.revenue.toLocaleString()}` }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  const externalRatings = await getMovieExternalRatings(movie.id)

  return (
    <div className="relative overflow-hidden bg-[var(--color-ink)] pb-16">
      <MovieHero movie={movie} />

      <div className="relative mx-auto w-full max-w-7xl space-y-16 px-6 pt-14 md:px-12">
        <MovieRatings
          tmdbScore={movie.vote_average}
          tmdbVotes={movie.vote_count}
          external={externalRatings}
        />

        <MovieReviewsSection movieId={movie.id} />

        {movie.credits?.cast?.length ? <CastSection cast={movie.credits.cast} /> : null}

        {movie.similar?.results?.length ? (
          <MovieCarousel
            movies={movie.similar.results}
            title="More like this"
            subtitle="Adjacent frames with a similar pulse"
          />
        ) : null}

        {details.length > 0 ? (
          <section className="space-y-6 border-t border-[var(--color-border)] pt-14">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
                Specs
              </p>
              <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
                Details
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
              {details.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 px-4 py-5"
                >
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                    {item.label}
                  </dt>
                  <dd className="mt-2 font-heading text-lg font-semibold tracking-tight text-[var(--color-text)]">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </div>
    </div>
  )
}
