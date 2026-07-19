"use client"

import { X, Star, Loader2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { modalBackdrop, modalContent, tapScale } from "@/lib/animations"
import { useRatings } from "@/hooks/useRatings"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import type { UserRating } from "@/types"
import { AnimatePresence, motion } from "framer-motion"

type RatingModalProps = {
  movie: TMDBMovie
  isOpen: boolean
  onClose: () => void
  existingRating?: UserRating
}

export function RatingModal({
  movie,
  isOpen,
  onClose,
  existingRating,
}: RatingModalProps) {
  const { rateMovie, resetRating, isRating, isResetting } = useRatings()
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [rating, setRating] = useState(existingRating?.rating || 0)
  const [review, setReview] = useState(existingRating?.review || "")
  const [hoverRating, setHoverRating] = useState(0)

  const getHalfStepValue = (
    event: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ): number => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const isLeftHalf = clickX < rect.width / 2
    return isLeftHalf ? starIndex - 0.5 : starIndex
  }

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    setRating(existingRating?.rating ?? 0)
    setReview(existingRating?.review ?? "")
    setHoverRating(0)
  }, [existingRating, isOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = async () => {
    if (rating === 0) return

    try {
      await rateMovie({
        movieId: movie.id,
        title: movie.title,
        poster: movie.poster_path || "",
        rating,
        review: review || undefined,
      })
      onClose()
      setRating(0)
      setReview("")
    } catch {
      // Error handled by hook toast
    }
  }

  const handleReset = async () => {
    try {
      await resetRating(movie.id)
      onClose()
      setRating(0)
      setReview("")
    } catch {
      // Error handled by hook toast
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rating-modal-title"
            tabIndex={-1}
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#111111] p-8 outline-none"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close rating modal"
              className="absolute right-4 top-4 text-white/40 transition-colors hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Movie Header */}
            <div className="mb-6 flex items-start gap-4">
              {movie.poster_path && (
                <Image
                  src={tmdb.getImageUrl(movie.poster_path, "w500")}
                  alt={movie.title}
                  width={60}
                  height={90}
                  unoptimized
                  className="rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{movie.title}</h3>
                {movie.release_date && (
                  <p className="text-sm text-white/60">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </div>
            </div>

            {/* Title */}
            <h2 id="rating-modal-title" className="mb-6 font-playfair text-2xl font-bold text-white">
              {existingRating ? "Update your rating" : "Rate this movie"}
            </h2>

            {/* Star Rating */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-center gap-2">
                {Array.from({ length: 10 }).map((_, i) => {
                  const starIndex = i + 1
                  const activeRating = hoverRating || rating
                  const isFilled = starIndex <= activeRating
                  const isHalf = !isFilled && starIndex - 0.5 <= activeRating

                  return (
                    <motion.button
                      key={i}
                      onClick={(event) => setRating(getHalfStepValue(event, starIndex))}
                      onMouseMove={(event) => setHoverRating(getHalfStepValue(event, starIndex))}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`Rate up to ${starIndex} out of 10`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={tapScale}
                      className="relative transition-all duration-200"
                    >
                      {isFilled ? (
                        <Star className="h-5 w-5 fill-[#C9A84C] text-[#C9A84C] transition-colors" />
                      ) : isHalf ? (
                        <span className="relative inline-flex">
                          <Star className="h-5 w-5 text-white/20" />
                          <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                            <Star className="h-5 w-5 fill-[#C9A84C] text-[#C9A84C]" />
                          </span>
                        </span>
                      ) : (
                        <Star className="h-5 w-5 text-white/20 transition-colors" />
                      )}
                    </motion.button>
                  )
                })}
              </div>
              <div className="text-center">
                <span className="font-playfair text-3xl font-bold text-[#C9A84C]">
                  {rating.toFixed(1)}
                </span>
                <span className="text-white/60">/10</span>
              </div>
            </div>

            {/* Review Textarea */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-semibold text-white/80">
                Write a review (optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value.slice(0, 500))}
                placeholder="What did you think of this movie?"
                className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-dm-sans text-white placeholder-white/30 transition-colors focus:border-[#C9A84C]/50 focus:outline-none"
              />
              <div className="mt-2 text-xs text-white/40">
                {review.length}/500 characters
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                onClick={handleSubmit}
                disabled={rating === 0 || isRating || isResetting}
                aria-label="Save rating"
                className="w-full rounded-lg bg-[#C9A84C] px-6 py-3 font-dm-sans font-semibold text-[#080808] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#D4B961]"
                whileTap={tapScale}
              >
                {isRating ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : existingRating ? (
                  "Update Rating"
                ) : (
                  "Save Rating"
                )}
              </motion.button>

              {existingRating ? (
                <motion.button
                  type="button"
                  onClick={handleReset}
                  disabled={isRating || isResetting}
                  className="w-full rounded-lg border border-white/15 px-6 py-3 font-dm-sans text-sm font-semibold text-white/80 transition-all duration-300 hover:border-red-400/60 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  whileTap={tapScale}
                >
                  {isResetting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </span>
                  ) : (
                    "Reset Rating"
                  )}
                </motion.button>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
