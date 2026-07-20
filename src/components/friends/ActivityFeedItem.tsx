"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { tmdb } from "@/lib/tmdb/client"
import { timeAgo } from "@/lib/utils"
import type { ActivityItem } from "@/types"

type ActivityFeedItemProps = {
	activity: ActivityItem
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
	if (activity.type === "watched_movie") {
		return `${activity.userName} logged ${activity.movieTitle ?? "a movie"}`
	}
	if (activity.type === "agreed_review") {
		return `${activity.userName} agreed with ${activity.targetUserName ?? "someone"}'s review of ${activity.movieTitle ?? "a movie"}`
	}
	if (activity.type === "commented_review") {
		return `${activity.userName} commented on ${activity.targetUserName ?? "someone"}'s review of ${activity.movieTitle ?? "a movie"}`
	}
	if (activity.type === "quoted_review") {
		return `${activity.userName} quoted a review while rating ${activity.movieTitle ?? "a movie"}`
	}
	return `${activity.userName} created a new list`
}

export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
	const router = useRouter()

	return (
		<article className="flex items-start gap-3 rounded-lg border border-[var(--color-border)] px-3 py-3 transition-colors hover:bg-white/[0.02]">
			<button
				type="button"
				onClick={() => router.push(`/profile/${activity.userId}`)}
				className="flex-none"
				aria-label={`Open ${activity.userName}'s profile`}
			>
				<AvatarUpload
					currentImage={activity.userImage}
					name={activity.userName}
					size="sm"
					editable={false}
				/>
			</button>

			<div className="min-w-0 flex-1">
				<p className="text-sm leading-relaxed text-[var(--color-text)]">
					{activityText(activity)}
				</p>
				<p className="mt-1 text-xs text-[var(--color-text-muted)]">
					{timeAgo(activity.createdAt)}
				</p>
			</div>

			{activity.moviePoster && activity.movieId ? (
				<button
					type="button"
					onClick={() => router.push(`/movie/${activity.movieId}`)}
					className="relative h-12 w-8 flex-none overflow-hidden rounded border border-[var(--color-border)]"
					aria-label={activity.movieTitle ?? "Open movie"}
				>
					<Image
						src={tmdb.getImageUrl(activity.moviePoster, "w200")}
						alt=""
						fill
						unoptimized
						sizes="32px"
						className="object-cover"
					/>
				</button>
			) : null}
		</article>
	)
}
