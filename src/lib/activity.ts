import { db } from "@/lib/db"
import { activities } from "@/lib/db/schema"

export async function logActivity(data: {
	userId: string
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
	movieId?: number
	movieTitle?: string
	moviePoster?: string
	rating?: number
	targetUserId?: string
	targetUserName?: string
}) {
	await db.insert(activities).values({
		userId: data.userId,
		type: data.type,
		movieId: data.movieId,
		movieTitle: data.movieTitle,
		moviePoster: data.moviePoster,
		rating: data.rating,
		targetUserId: data.targetUserId,
		targetUserName: data.targetUserName,
	})
}
