import { connectDB } from "@/lib/db/mongoose"
import ActivityModel from "@/models/Activity"

export async function logActivity(data: {
  userId: string
  type: "rated_movie" | "added_watchlist" | "removed_watchlist" | "became_friends" | "created_list" | "sent_request"
  movieId?: number
  movieTitle?: string
  moviePoster?: string
  rating?: number
  targetUserId?: string
  targetUserName?: string
}) {
  await connectDB()
  await ActivityModel.create(data)
}
