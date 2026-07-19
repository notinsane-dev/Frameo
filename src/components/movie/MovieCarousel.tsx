"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState } from "react"

import { MovieCard } from "@/components/movie/MovieCard"
import { fadeIn } from "@/lib/animations"
import type { TMDBMovie } from "@/lib/tmdb/types"

type MovieCarouselProps = {
  movies: TMDBMovie[]
  title: string
  subtitle?: string
}

export function MovieCarousel({ movies, title, subtitle }: MovieCarouselProps) {
  const [isHovered, setIsHovered] = useState(false)
  const trackRef = useRef<HTMLDivElement | null>(null)

  const scrollByCards = (direction: "left" | "right") => {
    const track = trackRef.current
    if (!track) return

    const firstCard = track.querySelector<HTMLElement>("[data-carousel-card='true']")
    const cardWidth = firstCard?.offsetWidth ?? 180
    const gap = 16
    const distance = (cardWidth + gap) * 3

    track.scrollBy({
      left: direction === "right" ? distance : -distance,
      behavior: "smooth",
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-heading text-2xl text-white">{title}</h3>
          {subtitle ? <p className="text-sm text-white/50">{subtitle}</p> : null}
        </div>
      </div>

      <div
        className="group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              data-carousel-card="true"
              className="min-w-0 flex-none basis-[40%] sm:basis-[28%] md:basis-[22%] lg:basis-[15.5%]"
            >
              <MovieCard movie={movie} showRating={false} />
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isHovered ? (
            <>
              <motion.button
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                type="button"
                onClick={() => scrollByCards("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-[#C9A84C]/30 bg-black/70 p-2 text-[#C9A84C]"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <motion.button
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                type="button"
                onClick={() => scrollByCards("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[#C9A84C]/30 bg-black/70 p-2 text-[#C9A84C]"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  )
}
