"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { FriendCard } from "@/components/friends/FriendCard"
import type { Friend } from "@/types"

type FriendsTabProps = {
	friends: Friend[]
	onRemoveFriend: (friendId: string) => Promise<void>
	onOpenFindPeople: () => void
}

export function FriendsTab({ friends, onRemoveFriend, onOpenFindPeople }: FriendsTabProps) {
	const router = useRouter()
	const [query, setQuery] = useState("")

	const filteredFriends = useMemo(() => {
		const q = query.trim().toLowerCase()
		if (!q) return friends
		return friends.filter(
			(friend) =>
				friend.name.toLowerCase().includes(q) ||
				(friend.username ?? "").toLowerCase().includes(q),
		)
	}, [friends, query])

	if (!friends.length) {
		return (
			<div className="max-w-md space-y-3 py-10">
				<p className="text-sm font-semibold text-[var(--color-text)]">No friends yet</p>
				<p className="text-sm text-[var(--color-text-muted)]">
					Search for people to connect with and share taste.
				</p>
				<button
					type="button"
					onClick={onOpenFindPeople}
					className="rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a]"
				>
					Find people
				</button>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-[var(--color-text-secondary)]">
					{filteredFriends.length} of {friends.length}
				</p>
				<input
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Search friends"
					className="w-full max-w-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"
				/>
			</div>

			{filteredFriends.length === 0 ? (
				<p className="py-8 text-sm text-[var(--color-text-muted)]">No matches for “{query}”</p>
			) : (
				<ul className="divide-y divide-[var(--color-border)] rounded-lg border border-[var(--color-border)]">
					{filteredFriends.map((friend) => (
						<li key={friend.id}>
							<FriendCard
								friend={friend}
								onViewProfile={() => router.push(`/profile/${friend.id}`)}
								onRemove={() => onRemoveFriend(friend.id)}
							/>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
