"use client"

import { Film } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef } from "react"

import type { TMDBGenre } from "@/lib/tmdb/types"
import { motion } from "framer-motion"
import { listItem, staggerContainerFast } from "@/lib/animations"
import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"

type GenreShowcaseProps = {
  genres: TMDBGenre[]
}

const genreGradients: Record<string, string> = {
  Action: "from-red-900 to-orange-900",
  Comedy: "from-yellow-800 to-amber-700",
  Drama: "from-blue-900 to-indigo-900",
  Horror: "from-gray-900 to-red-950",
  Romance: "from-pink-900 to-rose-800",
  "Science Fiction": "from-cyan-900 to-blue-900",
  Thriller: "from-zinc-900 to-slate-800",
  Animation: "from-purple-900 to-violet-800",
}

export function GenreShowcase({ genres }: GenreShowcaseProps) {
  const router = useRouter()
  const ref = useRef(null)
  useRevealOnScroll(ref)

  const getGradient = (genreName: string): string => {
    return genreGradients[genreName] || "from-zinc-800 to-zinc-900"
  }

  return (
    <section ref={ref} className="px-6 py-20 md:px-12">
      {/* Header */}
      <h2 className="mb-12 font-playfair text-4xl font-bold text-white">Explore by Genre</h2>

      {/* Genre Grid */}
      <motion.div
        className="grid grid-cols-2 gap-6 md:grid-cols-4"
        variants={staggerContainerFast}
        initial="hidden"
        animate="visible"
      >
        {genres.slice(0, 8).map((genre) => (
          <motion.button
            key={genre.id}
            variants={listItem}
            whileHover={{ scale: 1.03 }}
            onClick={() => router.push(`/explore?genre=${genre.id}`)}
            className={`group relative h-32 overflow-hidden rounded-lg bg-gradient-to-br ${getGradient(genre.name)} p-4 transition-all duration-300 hover:brightness-110`}
          >
            {/* Film Icon */}
            <Film className="absolute right-3 top-3 h-6 w-6 text-white/20 transition-all duration-300 group-hover:text-white/40" />

            {/* Genre Name */}
            <div className="flex h-full items-center justify-center">
              <h3 className="text-center font-playfair text-2xl font-bold text-white">
                {genre.name}
              </h3>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  )
}
