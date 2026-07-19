"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"

import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { motion } from "framer-motion"
import { fadeUp } from "@/lib/animations"
import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"

type AIPromoBannerProps = {
  movies: TMDBMovie[]
}

export function AIPromoBanner({ movies }: AIPromoBannerProps) {
  const ref = useRef(null)
  useRevealOnScroll(ref)

  // Get 3-4 random movies for collage
  const collageMovies = movies.slice(0, 4).filter((m) => m.poster_path)

  const rotations = ["-6deg", "3deg", "-2deg", "4deg"]

  return (
    <motion.section
      ref={ref}
      className="relative overflow-hidden rounded-lg border border-[#C9A84C]/20 bg-gradient-to-br from-[#C9A84C]/5 via-[#080808] to-[#080808] px-6 py-16 md:px-12 md:py-24"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      {/* Radial gradient background */}
      <div className="absolute inset-0 bg-radial from-[#C9A84C]/10 to-transparent opacity-40" />

      <div className="relative z-10 grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Left: Content */}
        <div>
          <div className="mb-6 flex items-center gap-3">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <Sparkles className="h-8 w-8 text-[#C9A84C]" />
            </motion.div>
            <span className="text-sm font-semibold text-[#C9A84C]">AI POWERED</span>
          </div>

          <h2 className="mb-4 font-playfair text-4xl font-bold text-white md:text-5xl">
            Let AI Curate Your Perfect Watchlist
          </h2>

          <p className="mb-8 text-lg text-white/60">
            Tell us your mood and we'll find movies you'll love using advanced AI recommendations
          </p>

          <Link
            href="/recommendations"
            className="inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-8 py-3 font-dm-sans font-semibold text-[#080808] transition-all duration-300 hover:bg-[#D4B961]"
          >
            Get Recommendations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Right: Floating Movie Collage */}
        <div className="relative h-80 w-full md:h-96">
          {collageMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              className="absolute"
              style={{
                left: `${20 + index * 25}%`,
                top: `${10 + (index % 2) * 30}%`,
                zIndex: collageMovies.length - index,
              }}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.2,
              }}
            >
              <motion.div
                className="overflow-hidden rounded-lg shadow-2xl"
                style={{
                  rotate: rotations[index],
                }}
                whileHover={{ scale: 1.05, rotate: 0 }}
              >
                <Image
                  src={tmdb.getImageUrl(movie.poster_path!, "w500")}
                  alt={movie.title}
                  width={120}
                  height={180}
                  unoptimized
                  className="object-cover"
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
