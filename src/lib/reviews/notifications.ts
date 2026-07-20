import { db } from "@/lib/db"
import { notifications } from "@/lib/db/schema"

type NotificationType =
	| "review_agree"
	| "review_disagree"
	| "review_comment"
	| "review_quote"

export async function createNotification(data: {
	userId: string
	actorId: string
	type: NotificationType
	ratingId?: number
	commentId?: number
	movieId?: number
	movieTitle?: string
}) {
	if (data.userId === data.actorId) return

	await db.insert(notifications).values({
		userId: data.userId,
		actorId: data.actorId,
		type: data.type,
		ratingId: data.ratingId,
		commentId: data.commentId,
		movieId: data.movieId,
		movieTitle: data.movieTitle,
	})
}
