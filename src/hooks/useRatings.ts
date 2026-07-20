"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"

import { trpc } from "@/lib/trpc/client"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useAuth } from "@/hooks/useAuth"
import type { UserRating } from "@/types"

type RateMovieInput = {
  movieId: number
  title: string
  poster: string
  rating: number
  review?: string
  quotedRatingId?: number
}

export function useRatings() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { showToast } = useToastContext()
  const utils = trpc.useUtils()

  const { data: ratings = [], isLoading, isError } = trpc.user.getRatings.useQuery(undefined, {
    enabled: isAuthenticated,
  })

  const rateMutation = trpc.user.rateMovie.useMutation({
    onSuccess: async () => {
      showToast("Rating saved!", "success")
      await Promise.all([
        utils.user.getRatings.invalidate(),
        utils.reviews.listForMovie.invalidate(),
        utils.reviews.listForAuthor.invalidate(),
        utils.reviews.getPopularWeek.invalidate(),
      ])
    },
    onError: () => {
      showToast("Failed to save rating", "error")
    },
  })

  const resetMutation = trpc.user.resetRating.useMutation({
    onSuccess: async () => {
      showToast("Rating reset", "info")
      await utils.user.getRatings.invalidate()
    },
    onError: () => {
      showToast("Failed to reset rating", "error")
    },
  })

  const ensureSignedIn = useCallback((): boolean => {
    if (isAuthenticated) return true

    showToast("Please sign in to rate movies", "info")
    router.push("/login")
    return false
  }, [isAuthenticated, router, showToast])

  const getUserRating = useCallback(
    (movieId: number): UserRating | undefined => {
      return ratings.find((rating) => rating.movieId === movieId)
    },
    [ratings]
  )

  const rateMovie = useCallback(
    async (data: RateMovieInput) => {
      if (!ensureSignedIn()) return
      await rateMutation.mutateAsync(data)
    },
    [ensureSignedIn, rateMutation]
  )

  const resetRating = useCallback(
    async (movieId: number) => {
      if (!ensureSignedIn()) return
      await resetMutation.mutateAsync({ movieId })
    },
    [ensureSignedIn, resetMutation]
  )

  return {
    ratings,
    isLoading,
    isError,
    isAuthenticated,
    getUserRating,
    rateMovie,
    resetRating,
    isRating: rateMutation.isPending,
    isResetting: resetMutation.isPending,
  }
}
