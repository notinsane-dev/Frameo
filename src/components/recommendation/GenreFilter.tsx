"use client"

import type { TMDBGenre } from "@/lib/tmdb/types"
import { motion } from "framer-motion"
import { listItem, staggerContainerFast } from "@/lib/animations"

type GenreFilterProps = {
  selected: string
  onChange: (genre: string) => void
  genres: TMDBGenre[]
}

export function GenreFilter({ selected, onChange, genres }: GenreFilterProps) {
  const displayGenres = [
    { id: "", name: "Any Genre" },
    ...genres.slice(0, 9),
  ]

  return (
    <motion.div
      className="flex flex-wrap gap-3"
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
    >
      {displayGenres.map((genre) => (
        <motion.button
          key={genre.id || "any"}
          variants={listItem}
          onClick={() => onChange(genre.id?.toString() || "")}
          whileTap={{ scale: 0.95 }}
          className={`rounded-full border px-4 py-2 font-dm-sans font-medium transition-all duration-300 ${
            selected === (genre.id?.toString() || "")
              ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white/90"
          }`}
        >
          {genre.name}
        </motion.button>
      ))}
    </motion.div>
  )
}
