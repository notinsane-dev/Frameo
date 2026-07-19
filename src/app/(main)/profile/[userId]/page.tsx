"use client"

import { Lock, UserPlus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useFriends } from "@/hooks/useFriends"
import { trpc } from "@/lib/trpc/client"

export default function FriendProfilePage() {
  const router = useRouter()
  const params = useParams<{ userId: string }>()
  const userId = String(params.userId)

  const { sendRequest, friendRequests, acceptRequest, rejectRequest, removeFriend } = useFriends()
  const { data, isLoading, error } = trpc.friends.getFriendProfile.useQuery({ userId })
  const profileUserId = data?.user.id ?? userId

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </AuthGuard>
    )
  }

  if (error?.data?.code === "FORBIDDEN") {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <Lock className="mx-auto h-10 w-10 text-white/30" />
          <h1 className="mt-4 font-playfair text-3xl text-white">This profile is private</h1>
          <p className="mt-2 text-white/50">Become friends to view more details.</p>
        </div>
      </AuthGuard>
    )
  }

  if (!data) return null

  const pendingRequest = friendRequests.find((request) => request.senderId === profileUserId)

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
        <section className="glass-card rounded-3xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                {data.user.image ? (
                  <img src={data.user.image} alt={data.user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl text-white">{data.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="font-playfair text-4xl text-white">{data.user.name}</h1>
                <p className="text-white/50">{data.user.username ? `@${data.user.username}` : "No username"}</p>
                {data.user.bio ? <p className="mt-2 text-sm text-white/60">{data.user.bio}</p> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {data.friendshipStatus === "none" ? (
                <button
                  type="button"
                  onClick={() => void sendRequest(profileUserId)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C9A84C] px-4 py-2 text-sm font-medium text-[#080808]"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Friend
                </button>
              ) : null}

              {data.friendshipStatus === "pending_sent" ? (
                <button type="button" disabled className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/40">
                  Request Sent
                </button>
              ) : null}

              {data.friendshipStatus === "pending_received" ? (
                <>
                  <button
                    type="button"
                    onClick={() => pendingRequest && void acceptRequest(pendingRequest.requestId)}
                    className="rounded-full bg-[#C9A84C] px-4 py-2 text-sm font-medium text-[#080808]"
                  >
                    Accept Request
                  </button>
                  <button
                    type="button"
                    onClick={() => pendingRequest && void rejectRequest(pendingRequest.requestId)}
                    className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80"
                  >
                    Decline
                  </button>
                </>
              ) : null}

              {data.friendshipStatus === "friends" ? (
                <>
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm text-white">Friends ✓</span>
                  <button
                    type="button"
                    onClick={() => void removeFriend(profileUserId)}
                    className="rounded-full border border-red-400/50 px-4 py-2 text-sm text-red-300"
                  >
                    Remove Friend
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-playfair text-2xl text-white">Stats</h2>
            <div className="mt-4 space-y-2 text-white/70">
              <p>Watchlist: {data.stats.watchlistCount}</p>
              <p>Ratings: {data.stats.ratingsCount}</p>
              <p>Average Rating: {data.stats.avgRating}</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-playfair text-2xl text-white">Recent Watchlist</h2>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {data.watchlist.slice(0, 10).map((item: { movieId: number; title: string }) => (
                <button
                  key={item.movieId}
                  type="button"
                  onClick={() => router.push(`/movie/${item.movieId}`)}
                  className="block text-left text-white/70 hover:text-white"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-5">
          <h2 className="font-playfair text-2xl text-white">Recent Ratings</h2>
          {data.friendshipStatus === "friends" ? (
            <div className="mt-4 space-y-2 text-sm text-white/70">
              {data.ratings.slice(0, 10).map((rating: { movieId: number; title: string; rating: number }) => (
                <button
                  key={rating.movieId}
                  type="button"
                  onClick={() => router.push(`/movie/${rating.movieId}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-left hover:bg-white/5"
                >
                  <span>{rating.title}</span>
                  <span className="text-[#C9A84C]">{rating.rating}/10</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 text-white/40">
              <Lock className="h-4 w-4" />
              Become friends to see ratings
            </div>
          )}
        </section>
      </div>
    </AuthGuard>
  )
}
