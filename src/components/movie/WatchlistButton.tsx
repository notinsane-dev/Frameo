"use client"

import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { hoverScale, scaleIn, tapScale } from "@/lib/animations"
import { useAuth } from "@/hooks/useAuth"
import { useWatchlist } from "@/hooks/useWatchlist"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { AnimatePresence, motion } from "framer-motion"

type WatchlistButtonProps = {
  movie: TMDBMovie
  variant?: "icon" | "full"
}

export function WatchlistButton({ movie, variant = "icon" }: WatchlistButtonProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isAdding, isRemoving } =
    useWatchlist()

  const inWatchlist = isInWatchlist(movie.id)
  const isLoading = isAdding || isRemoving

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (inWatchlist) {
      await removeFromWatchlist(movie.id)
    } else {
      await addToWatchlist(movie)
    }
  }

  if (variant === "icon") {
    return (
      <motion.button
        onClick={handleClick}
        disabled={isLoading}
        aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        className="relative inline-flex items-center justify-center rounded-full p-2 transition-all duration-300 disabled:cursor-not-allowed"
        whileHover={hoverScale}
        whileTap={tapScale}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#C9A84C]" />
        ) : (
          <AnimatePresence mode="wait">
            {inWatchlist ? (
              <motion.div
                key="added"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
              >
                <BookmarkCheck className="h-5 w-5 text-[#C9A84C]" />
              </motion.div>
            ) : (
              <motion.div
                key="not-added"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
              >
                <Bookmark className="h-5 w-5 text-white/60 transition-colors hover:text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.button>
    )
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-dm-sans font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
        inWatchlist
          ? "border border-[#C9A84C] text-[#C9A84C] hover:bg-[#C9A84C]/10"
          : "border border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10"
      }`}
      whileHover={hoverScale}
      whileTap={tapScale}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Adding...</span>
        </>
      ) : (
        <>
          <AnimatePresence mode="wait">
            {inWatchlist ? (
              <motion.div
                key="added"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <BookmarkCheck className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="not-added"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <Bookmark className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-sm">{inWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
        </>
      )}
    </motion.button>
  )
}
