"use client"

import { ActivityFeedItem } from "@/components/friends/ActivityFeedItem"
import { trpc } from "@/lib/trpc/client"

function dayLabel(date: Date | string) {
	const target = new Date(date)
	const now = new Date()
	const diffDays = Math.floor(
		(now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
	)

	if (diffDays <= 0) return "Today"
	if (diffDays === 1) return "Yesterday"
	return target.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	})
}

export function ActivityTab() {
	const { data: activities = [], isLoading } = trpc.friends.getFriendActivity.useQuery()

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, index) => (
					<div
						key={index}
						className="h-14 animate-pulse rounded-lg bg-[var(--color-surface)]"
					/>
				))}
			</div>
		)
	}

	if (!activities.length) {
		return (
			<p className="py-8 text-sm text-[var(--color-text-muted)]">
				Add friends to see their activity here.
			</p>
		)
	}

	return (
		<div className="space-y-6">
			{activities.map((activity, idx) => {
				const label = dayLabel(activity.createdAt)
				const showLabel = idx === 0 || label !== dayLabel(activities[idx - 1].createdAt)

				return (
					<div key={activity.id}>
						{showLabel ? (
							<p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
								{label}
							</p>
						) : null}
						<ActivityFeedItem activity={activity} />
					</div>
				)
			})}
		</div>
	)
}
