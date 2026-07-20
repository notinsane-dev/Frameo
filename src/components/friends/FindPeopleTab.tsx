"use client"

import { useEffect, useState } from "react"

import { UserSearchResult } from "@/components/friends/UserSearchResult"
import { ShareActions } from "@/components/share/ShareActions"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useAuth } from "@/hooks/useAuth"
import { useFriends } from "@/hooks/useFriends"
import { trpc } from "@/lib/trpc/client"

export function FindPeopleTab() {
	const { user } = useAuth()
	const { data: profile } = trpc.user.getProfile.useQuery()
	const { sendRequest, acceptRequest, friendRequests } = useFriends()
	const [query, setQuery] = useState("")
	const [debouncedQuery, setDebouncedQuery] = useState("")

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400)
		return () => clearTimeout(timer)
	}, [query])

	const { data: results = [], isLoading } = trpc.friends.searchUsers.useQuery(
		{ query: debouncedQuery },
		{ enabled: debouncedQuery.length >= 2 },
	)

	const username = profile?.username || user?.username
	const userId = user?.id

	return (
		<div className="space-y-5">
			{userId && username && !username.startsWith("temp_") ? (
				<div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-5 py-5">
					<p className="text-sm font-medium text-[var(--color-text)]">
						Friends not on Frameo yet?
					</p>
					<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
						Share your invite link — when they join, you&apos;ll get a friend request
						connection.
					</p>
					<ShareActions
						className="mt-4"
						userId={userId}
						username={username}
						name={profile?.name || user?.name}
						compact
					/>
				</div>
			) : null}

			<div className="space-y-2">
				<label
					htmlFor="find-people"
					className="block text-sm text-[var(--color-text-secondary)]"
				>
					Search
				</label>
				<input
					id="find-people"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Name or username"
					className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"
				/>
			</div>

			{debouncedQuery.length < 2 ? (
				<p className="text-sm text-[var(--color-text-muted)]">
					Type at least 2 characters to search.
				</p>
			) : isLoading ? (
				<div className="flex justify-center py-12">
					<LoadingSpinner />
				</div>
			) : results.length === 0 ? (
				<p className="text-sm text-[var(--color-text-muted)]">
					No users found for “{debouncedQuery}”
				</p>
			) : (
				<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
					{results.map((result) => (
						<li key={result.id}>
							<UserSearchResult
								user={result}
								onAction={() => {
									if (result.friendshipStatus === "none") {
										void sendRequest(result.id)
									}
									if (result.friendshipStatus === "pending_received") {
										const request = friendRequests.find(
											(item) => item.senderId === result.id,
										)
										if (request) {
											void acceptRequest(request.requestId)
										}
									}
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
