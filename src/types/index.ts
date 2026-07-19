import type { TMDBMovie } from "@/lib/tmdb/types"

export interface WatchlistItem {
  movieId: number
  title: string
  poster: string
  addedAt: string
}

export interface UserRating {
  movieId: number
  rating: number
  review?: string
  createdAt: string
}

export interface RecommendationResult {
  movie: TMDBMovie
  reason: string
  score: number
}

export interface FriendRequest {
  requestId: string
  senderId: string
  senderName: string
  senderImage: string | null
  senderUsername: string | null
  createdAt: Date
}

export interface Friend {
  id: string
  name: string
  image: string | null
  username: string | null
  bio: string | null
}

export interface ActivityItem {
  id: string
  userId: string
  userName: string
  userImage: string | null
  type: "rated_movie" | "added_watchlist" | "removed_watchlist" | "became_friends" | "created_list"
  movieId?: number
  movieTitle?: string
  moviePoster?: string
  rating?: number
  targetUserId?: string
  targetUserName?: string
  createdAt: Date
}

export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends"

export interface UserSearchResult {
  id: string
  name: string
  image: string | null
  username: string | null
  friendshipStatus: FriendshipStatus
}
