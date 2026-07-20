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
          <Loader2 className="h-5 w-5 animate-spin text-[var(--color-signal)]" />
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
                <BookmarkCheck className="h-5 w-5 text-[var(--color-signal)]" />
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
                <Bookmark className="h-5 w-5 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]" />
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
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
        inWatchlist
          ? "border border-[var(--color-signal)] text-[var(--color-signal)] hover:bg-[var(--color-signal-muted)]"
          : "border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text)] hover:border-[var(--color-signal-border)]"
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
