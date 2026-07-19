"use client"

import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { RatingsTab } from "@/app/(main)/profile/components/RatingsTab"
import { WatchlistTab } from "@/app/(main)/profile/components/WatchlistTab"
import { EditProfileModal } from "@/components/profile/EditProfileModal"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { useAuth } from "@/hooks/useAuth"
import { useRatings } from "@/hooks/useRatings"
import { useWatchlist } from "@/hooks/useWatchlist"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const StatsTab = dynamic(() => import("@/app/(main)/profile/components/StatsTab"), { ssr: false })

const tabs = [
  { id: "watchlist", label: "Watchlist" },
  { id: "ratings", label: "Ratings" },
  { id: "stats", label: "Stats" },
] as const

export default function ProfilePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "watchlist"
  const { user } = useAuth()
  const utils = trpc.useUtils()
  const { watchlist } = useWatchlist()
  const { ratings } = useRatings()
  const { data: profile } = trpc.user.getProfile.useQuery()
  const [isEditing, setIsEditing] = useState(false)

  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length) * 10)
    : 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      <ProfileHeader
        user={{
          name: profile?.name || user?.name,
          username: profile?.username || user?.username,
          image: profile?.image || user?.image,
          email: profile?.email || user?.email,
        }}
        watchlistCount={watchlist.length}
        ratingsCount={ratings.length}
        averageRating={averageRating}
        isOwnProfile
        onAvatarUpload={() => {
          void utils.user.getProfile.invalidate()
        }}
      />

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => setIsEditing((prev) => !prev)}
          className="rounded-full border border-[#C9A84C] px-4 py-2 text-sm text-[#C9A84C]"
        >
          {isEditing ? "Close" : "Edit Profile"}
        </button>
      </div>

      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        user={{
          name: profile?.name,
          username: profile?.username,
          image: profile?.image,
          bio: profile?.bio,
          isPublic: profile?.isPublic,
        }}
      />

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => router.push(`/profile?tab=${tab.id}`)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-all",
              activeTab === tab.id
                ? "border-[#C9A84C] bg-[#C9A84C] text-[#080808]"
                : "border-white/10 bg-white/5 text-white/60",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "ratings" ? <RatingsTab /> : null}
      {activeTab === "stats" ? <StatsTab /> : null}
      {activeTab === "watchlist" ? <WatchlistTab /> : null}
    </div>
  )
}
