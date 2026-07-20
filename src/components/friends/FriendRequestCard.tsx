"use client"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { timeAgo } from "@/lib/utils"
import type { FriendRequest } from "@/types"

type FriendRequestCardProps = {
	request: FriendRequest
	onAccept: () => void
	onReject: () => void
	isLoading?: boolean
}

export function FriendRequestCard({
	request,
	onAccept,
	onReject,
	isLoading = false,
}: FriendRequestCardProps) {
	return (
		<article className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 items-center gap-3">
				<AvatarUpload
					currentImage={request.senderImage}
					name={request.senderName}
					size="sm"
					editable={false}
				/>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-[var(--color-text)]">
						{request.senderName}
					</p>
					<p className="text-xs text-[var(--color-text-secondary)]">
						Wants to connect · {timeAgo(request.createdAt)}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2">
				<button
					type="button"
					onClick={onAccept}
					disabled={isLoading}
					className="rounded-lg bg-[var(--color-signal)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-50"
				>
					Accept
				</button>
				<button
					type="button"
					onClick={onReject}
					disabled={isLoading}
					className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] disabled:opacity-50"
				>
					Decline
				</button>
			</div>
		</article>
	)
}
