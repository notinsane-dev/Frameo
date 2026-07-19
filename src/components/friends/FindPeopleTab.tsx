"use client"

import { Search } from "lucide-react"
import { useEffect, useState } from "react"

import { UserSearchResult } from "@/components/friends/UserSearchResult"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { trpc } from "@/lib/trpc/client"
import { useFriends } from "@/hooks/useFriends"

export function FindPeopleTab() {
  const { sendRequest, acceptRequest, friendRequests } = useFriends()
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(timer)
  }, [query])

  const { data: results = [], isLoading } = trpc.friends.searchUsers.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2,
    },
  )

  if (debouncedQuery.length < 2) {
    return (
      <div className="space-y-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#C9A84C]/60"
        />
        <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
          <Search className="h-14 w-14 text-white/10" />
          <p className="mt-4 text-white/30">Search by name or email</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by name or email"
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#C9A84C]/60"
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : results.length === 0 ? (
        <p className="text-center text-white/40">No users found for "{debouncedQuery}"</p>
      ) : (
        <div className="space-y-3">
          {results.map((user) => (
            <UserSearchResult
              key={user.id}
              user={user}
              onAction={() => {
                if (user.friendshipStatus === "none") {
                  void sendRequest(user.id)
                }
                if (user.friendshipStatus === "pending_received") {
                  const request = friendRequests.find((item) => item.senderId === user.id)
                  if (request) {
                    void acceptRequest(request.requestId)
                  }
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
