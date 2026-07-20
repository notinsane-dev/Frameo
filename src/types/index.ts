import type { TMDBMovie } from "@/lib/tmdb/types"

export interface WatchlistItem {
	movieId: number
	title: string
	poster?: string | null
	overview?: string | null
	voteAverage?: number | null
	releaseDate?: string | null
	addedAt: string | Date
}

export interface UserRating {
	movieId: number
	rating: number
	review?: string | null
	poster?: string | null
	title?: string
	createdAt: string | Date
	updatedAt?: string | Date
}

export interface RecommendationResult {
	movie: TMDBMovie
	reason: string
	score: number
	availableOn?: string[]
	similarLiked?: string[]
	suggestedHideVibes?: string[]
}

export interface TasteTwin {
	id: string
	name: string
	username: string | null
	image: string | null
	bio: string | null
	similarity: number
	isFriend: boolean
	overlapCount: number
	overlapTitles: string[]
	theirPicks: string[]
	whyMatch: string
}

export interface WatchedLogItem {
	id: number
	movieId: number
	title: string
	poster?: string | null
	watchedAt: string | Date
	capsuleReview?: string | null
}

export interface FriendRequest {
	requestId: string
	senderId: string
	senderName: string
	senderImage: string | null
	senderUsername: string | null
	createdAt: string | Date
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
	type:
		| "rated_movie"
		| "added_watchlist"
		| "removed_watchlist"
		| "became_friends"
		| "created_list"
		| "sent_request"
		| "watched_movie"
		| "agreed_review"
		| "commented_review"
		| "quoted_review"
	movieId?: number | null
	movieTitle?: string | null
	moviePoster?: string | null
	rating?: number | null
	targetUserId?: string | null
	targetUserName?: string | null
	createdAt: string | Date
}

export type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "friends"

export interface UserSearchResult {
	id: string
	name: string
	image: string | null
	username: string | null
	friendshipStatus: FriendshipStatus
}
