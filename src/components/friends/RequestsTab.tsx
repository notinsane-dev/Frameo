"use client"

import { FriendRequestCard } from "@/components/friends/FriendRequestCard"
import { timeAgo } from "@/lib/utils"
import type { FriendRequest } from "@/types"

type SentRequest = {
	requestId: string
	receiverId: string
	receiverName: string
	receiverImage: string | null
	receiverUsername: string | null
	createdAt: string | Date
}

type RequestsTabProps = {
	requests: FriendRequest[]
	sentRequests: SentRequest[]
	onAccept: (requestId: string) => Promise<void>
	onReject: (requestId: string) => Promise<void>
	onCancelSent: (requestId: string) => Promise<void>
}

export function RequestsTab({
	requests,
	sentRequests,
	onAccept,
	onReject,
	onCancelSent,
}: RequestsTabProps) {
	return (
		<div className="space-y-10">
			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-[var(--color-text)]">Received</h2>
				{!requests.length ? (
					<p className="text-sm text-[var(--color-text-muted)]">No pending requests</p>
				) : (
					<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
						{requests.map((request) => (
							<li key={request.requestId}>
								<FriendRequestCard
									request={request}
									onAccept={() => onAccept(request.requestId)}
									onReject={() => onReject(request.requestId)}
								/>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="space-y-3">
				<h2 className="text-sm font-semibold text-[var(--color-text)]">Sent</h2>
				{!sentRequests.length ? (
					<p className="text-sm text-[var(--color-text-muted)]">No pending sent requests</p>
				) : (
					<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
						{sentRequests.map((request) => (
							<li
								key={request.requestId}
								className="flex items-center justify-between gap-4 px-4 py-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]">
										{request.receiverImage ? (
											<img
												src={request.receiverImage}
												alt=""
												className="h-full w-full object-cover"
											/>
										) : (
											<span className="text-sm font-semibold text-[var(--color-text)]">
												{request.receiverName.charAt(0).toUpperCase()}
											</span>
										)}
									</div>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-[var(--color-text)]">
											{request.receiverName}
										</p>
										<p className="text-xs text-[var(--color-text-muted)]">
											Pending · {timeAgo(request.createdAt)}
										</p>
									</div>
								</div>

								<button
									type="button"
									onClick={() => onCancelSent(request.requestId)}
									className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
								>
									Cancel
								</button>
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}
