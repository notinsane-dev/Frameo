"use client"

import { Users } from "lucide-react"
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
    return friends.filter((friend) => friend.name.toLowerCase().includes(q) || (friend.username ?? "").toLowerCase().includes(q))
  }, [friends, query])

  if (!friends.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center">
        <Users className="h-12 w-12 text-white/10" />
        <p className="mt-4 text-white/40">No friends yet</p>
        <p className="text-sm text-white/20">Search for people to add as friends</p>
        <button
          type="button"
          onClick={onOpenFindPeople}
          className="mt-5 rounded-full border border-[#C9A84C] px-4 py-2 text-sm text-[#C9A84C]"
        >
          Find People
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/60">{friends.length} friends</p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search friends"
          className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]/60"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredFriends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            onViewProfile={() => router.push(`/profile/${friend.id}`)}
            onRemove={() => onRemoveFriend(friend.id)}
          />
        ))}
      </div>
    </div>
  )
}
