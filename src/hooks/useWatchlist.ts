"use client"

import { useCallback, useEffect, useState } from "react"

import { useToastContext } from "@/components/shared/ToastProvider"
import { trpc } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import type { WatchlistItem } from "@/types"

export function useWatchlist() {
  const [optimisticWatchlist, setOptimisticWatchlist] = useState<WatchlistItem[]>([])
  const { showToast } = useToastContext()
  const utils = trpc.useUtils()

  const {
    data: watchlistData,
    isLoading,
    isError,
  } = trpc.user.getWatchlist.useQuery()

  useEffect(() => {
    if (watchlistData) {
      const timer = setTimeout(() => {
        setOptimisticWatchlist(watchlistData)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [watchlistData])

  const addMutation = trpc.user.addToWatchlist.useMutation({
    onSuccess: async () => {
      showToast("Added to watchlist", "success")
      await utils.user.getWatchlist.invalidate()
    },
    onError: () => {
      showToast("Failed to add to watchlist", "error")
    },
  })

  const removeMutation = trpc.user.removeFromWatchlist.useMutation({
    onSuccess: async () => {
      showToast("Removed from watchlist", "info")
      await utils.user.getWatchlist.invalidate()
    },
    onError: () => {
      showToast("Failed to remove from watchlist", "error")
    },
  })

  const isInWatchlist = useCallback(
    (movieId: number): boolean => {
      return optimisticWatchlist.some((item) => item.movieId === movieId)
    },
    [optimisticWatchlist]
  )

  const addToWatchlist = useCallback(
    async (movie: TMDBMovie) => {
      if (!movie.poster_path) return

      // Optimistic update
      const newItem: WatchlistItem = {
        movieId: movie.id,
        title: movie.title,
        poster: movie.poster_path,
        addedAt: new Date().toISOString(),
      }
      setOptimisticWatchlist((prev) => [newItem, ...prev])

      try {
        await addMutation.mutateAsync({
          movieId: movie.id,
          title: movie.title,
          poster: movie.poster_path,
        })
      } catch {
        // Rollback on error
        setOptimisticWatchlist((prev) =>
          prev.filter((item) => item.movieId !== movie.id)
        )
      }
    },
    [addMutation]
  )

  const removeFromWatchlist = useCallback(
    async (movieId: number) => {
      // Optimistic update
      setOptimisticWatchlist((prev) =>
        prev.filter((item) => item.movieId !== movieId)
      )

      try {
        await removeMutation.mutateAsync({ movieId })
      } catch {
        // Rollback on error
        await utils.user.getWatchlist.refetch()
      }
    },
    [removeMutation, utils]
  )

  return {
    watchlist: optimisticWatchlist,
    isLoading,
    isError,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
