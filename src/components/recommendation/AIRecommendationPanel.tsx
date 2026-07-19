"use client"

import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { RatingStars } from "@/components/shared/RatingStars"
import { tmdb } from "@/lib/tmdb/client"
import { listItem, staggerContainer } from "@/lib/animations"
import type { RecommendationResult } from "@/types"
import { AnimatePresence, motion } from "framer-motion"

type AIRecommendationPanelProps = {
  recommendations: RecommendationResult[]
  isLoading: boolean
}

const loadingMessages = [
  "Analyzing your taste...",
  "Consulting the AI...",
  "Finding perfect matches...",
  "Crafting recommendations...",
]

export function AIRecommendationPanel({
  recommendations,
  isLoading,
}: AIRecommendationPanelProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) return

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isLoading])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 py-20">
        {/* Pulsing Orb */}
        <div className="relative h-24 w-24">
          {/* Rotating Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#C9A84C] border-r-[#C9A84C]"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Pulsing Center */}
          <motion.div
            className="absolute inset-4 rounded-full bg-[#C9A84C]"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 0.4, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Message Cycling */}
        <div className="h-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center text-lg text-white/80"
            >
              {loadingMessages[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-xl text-white/60">No recommendations found</p>
        <p className="text-sm text-white/40">Try different preferences</p>
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {recommendations.map((rec) => (
          <motion.div
            key={rec.movie.id}
            variants={listItem}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-white/5 to-white/2 border border-white/10 transition-all duration-300 hover:border-[#C9A84C]/50"
          >
            {/* Blurred Background */}
            {rec.movie.backdrop_path && (
              <div className="absolute inset-0 z-0">
                <Image
                  src={tmdb.getImageUrl(rec.movie.backdrop_path, "w780")}
                  alt={rec.movie.title}
                  fill
                  unoptimized
                  className="object-cover blur-xl scale-110"
                  sizes="100vw"
                />
              </div>
            )}

            {/* Dark Overlay */}
            <div className="absolute inset-0 z-1 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-[#080808]/20" />

            {/* Content */}
            <div className="relative z-10 flex gap-4 p-5">
              {/* Poster Thumbnail */}
              {rec.movie.poster_path && (
                <div className="flex-shrink-0">
                  <Image
                    src={tmdb.getImageUrl(rec.movie.poster_path, "w500")}
                    alt={rec.movie.title}
                    width={80}
                    height={120}
                    unoptimized
                    className="rounded-lg object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between">
                {/* Title & Year */}
                <div>
                  <h3 className="line-clamp-2 font-playfair text-lg font-bold text-white">
                    {rec.movie.title}
                  </h3>
                  {rec.movie.release_date && (
                    <p className="text-sm text-white/60">
                      {new Date(rec.movie.release_date).getFullYear()}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div className="my-2">
                  <RatingStars rating={rec.movie.vote_average || 0} />
                </div>

                {/* Recommendation Section */}
                <div className="mb-3 space-y-2">
                  <p className="text-xs font-semibold text-[#C9A84C]">WHY YOU'LL LOVE IT:</p>
                  <p className="line-clamp-2 text-xs text-white/70">{rec.reason}</p>
                </div>

                {/* Confidence Score */}
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5CC8F]"
                      initial={{ width: 0 }}
                      animate={{ width: `${rec.score * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-white/60">{Math.round(rec.score * 100)}%</span>
                </div>

                {/* View Button */}
                <Link
                  href={`/movie/${rec.movie.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 px-3 py-1.5 text-xs font-semibold text-[#C9A84C] transition-all duration-300 hover:bg-[#C9A84C] hover:text-[#080808]"
                >
                  View Movie
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}
