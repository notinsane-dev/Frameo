import { User } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import { cache } from "react"

import { MovieCarousel } from "@/components/movie/MovieCarousel"
import { MovieHero } from "@/components/movie/MovieHero"
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
      title: "Movie Details",
      description: "Explore movies on CineAI",
    }
  }
}

export default async function MovieDetailPage({ params }: MovieDetailPageProps) {
  const { id } = await params
  const movieId = Number(id)

  if (!Number.isFinite(movieId) || movieId <= 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-playfair text-4xl text-white">Movie unavailable</h1>
        <p className="max-w-xl text-white/50">The requested movie id is invalid.</p>
      </div>
    )
  }

  let movie

  try {
    movie = await getMovieById(movieId)
  } catch {
    movie = null
  }

  if (!movie) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-playfair text-4xl text-white">Movie unavailable</h1>
        <p className="max-w-xl text-white/50">
          We could not load this movie right now. Please try again later.
        </p>
      </div>
    )
  }

  const backdropUrl = movie.backdrop_path ? tmdb.getImageUrl(movie.backdrop_path, "w780") : null
  const posterUrl = movie.poster_path ? tmdb.getImageUrl(movie.poster_path, "w500") : null

  return (
    <div className="relative overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#060606]" />

        {backdropUrl ? (
          <div
            className="absolute inset-0 opacity-30 blur-2xl saturate-150"
            style={{
              backgroundImage: `url(${backdropUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}

        {posterUrl ? (
          <div
            className="absolute -left-20 top-[18%] h-[38rem] w-[38rem] rounded-full opacity-35 blur-3xl"
            style={{
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ) : null}

        <div className="absolute -right-20 top-[24%] h-[34rem] w-[34rem] rounded-full bg-[#C9A84C]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(201,168,76,0.18),transparent_42%),radial-gradient(circle_at_76%_18%,rgba(59,130,246,0.13),transparent_40%),linear-gradient(to_bottom,rgba(8,8,8,0.58),rgba(8,8,8,0.96)_34%,rgba(8,8,8,1)_72%)]" />
      </div>

      <MovieHero movie={movie} />

      <div className="relative mx-auto w-full max-w-7xl space-y-10 px-6 pt-10">
        <section className="space-y-4">
          <h2 className="font-heading text-3xl text-white">Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {movie.credits.cast.slice(0, 16).map((member) => (
              <div
                key={`${member.id}-${member.order}`}
                className="w-32 flex-none rounded-xl border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="relative mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
                  {member.profile_path ? (
                    <Image
                      src={tmdb.getImageUrl(member.profile_path, "w200")}
                      alt={member.name}
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/50">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <p className="line-clamp-1 text-center text-sm font-medium text-white">{member.name}</p>
                <p className="line-clamp-1 text-center text-xs text-white/50">{member.character}</p>
              </div>
            ))}
          </div>
        </section>

        <MovieCarousel
          movies={movie.similar.results}
          title="More Like This"
          subtitle="Movies with similar tone and story"
        />

        <section className="space-y-4">
          <h2 className="font-heading text-3xl text-white">Details</h2>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Runtime: {movie.runtime} min
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Release Date: {movie.release_date}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Budget: ${movie.budget.toLocaleString()}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Revenue: ${movie.revenue.toLocaleString()}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80">
              Status: {movie.status}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
