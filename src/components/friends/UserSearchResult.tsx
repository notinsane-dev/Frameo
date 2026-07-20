"use client"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { cn } from "@/lib/utils"
import type { UserSearchResult as UserSearchResultType } from "@/types"

type UserSearchResultProps = {
	user: UserSearchResultType
	onAction: () => void
}

function actionLabel(status: UserSearchResultType["friendshipStatus"]) {
	if (status === "pending_sent") return "Requested"
	if (status === "pending_received") return "Accept"
	if (status === "friends") return "Friends"
	return "Add"
}

export function UserSearchResult({ user, onAction }: UserSearchResultProps) {
	const isDisabled =
		user.friendshipStatus === "pending_sent" || user.friendshipStatus === "friends"
	const isPrimary =
		user.friendshipStatus === "none" || user.friendshipStatus === "pending_received"

	return (
		<article className="flex items-center justify-between gap-4 px-4 py-3">
			<div className="flex min-w-0 items-center gap-3">
				<AvatarUpload
					currentImage={user.image}
					name={user.name}
					size="md"
					editable={false}
				/>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-[var(--color-text)]">
						{user.name}
					</p>
					<p className="truncate text-xs text-[var(--color-text-muted)]">
						{user.username ? `@${user.username}` : "No username"}
					</p>
				</div>
			</div>

			<button
				type="button"
				disabled={isDisabled}
				onClick={onAction}
				className={cn(
					"shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
					isPrimary
						? "bg-[var(--color-signal)] text-[var(--color-ink)] hover:bg-[#ff6b5a]"
						: "border border-[var(--color-border)] text-[var(--color-text-muted)]",
				)}
			>
				{actionLabel(user.friendshipStatus)}
			</button>
		</article>
	)
}
