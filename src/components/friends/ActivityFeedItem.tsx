"use client"

import { motion } from "framer-motion"
import { Bookmark, Star, Users } from "lucide-react"
import { useRouter } from "next/navigation"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { timeAgo } from "@/lib/utils"
import type { ActivityItem } from "@/types"

type ActivityFeedItemProps = {
  activity: ActivityItem
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  if (type === "rated_movie") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A84C] text-[#080808]">
        <Star className="h-3 w-3" />
      </span>
    )
  }

  if (type === "added_watchlist" || type === "removed_watchlist") {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
        <Bookmark className="h-3 w-3" />
      </span>
    )
  }

  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
      <Users className="h-3 w-3" />
    </span>
  )
}

function activityText(activity: ActivityItem) {
  if (activity.type === "rated_movie") {
    return `${activity.userName} rated ${activity.movieTitle ?? "a movie"} ${activity.rating ?? 0}/10`
  }

  if (activity.type === "added_watchlist") {
    return `${activity.userName} added ${activity.movieTitle ?? "a movie"} to watchlist`
  }

  if (activity.type === "removed_watchlist") {
    return `${activity.userName} removed ${activity.movieTitle ?? "a movie"} from watchlist`
  }

  if (activity.type === "became_friends") {
    return `${activity.userName} and ${activity.targetUserName ?? "someone"} are now friends`
  }

  return `${activity.userName} created a new list`
}

export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  const router = useRouter()

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/4 p-3"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => router.push(`/profile/${activity.userId}`)}
          className="flex items-center justify-center"
        >
          <AvatarUpload currentImage={activity.userImage} name={activity.userName} size="sm" editable={false} />
        </button>
        <span className="absolute -bottom-1 -right-1">
          <ActivityIcon type={activity.type} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/85">{activityText(activity)}</p>
        <p className="mt-1 text-xs text-white/30">{timeAgo(activity.createdAt)}</p>
      </div>

      {activity.moviePoster && activity.movieId ? (
        <button type="button" onClick={() => router.push(`/movie/${activity.movieId}`)} className="overflow-hidden rounded-md border border-white/10">
          <img src={`https://image.tmdb.org/t/p/w200${activity.moviePoster}`} alt={activity.movieTitle ?? "Movie"} className="h-10 w-7 object-cover" />
        </button>
      ) : null}
    </motion.article>
  )
}
