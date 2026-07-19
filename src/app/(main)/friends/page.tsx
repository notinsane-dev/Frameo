"use client"

import { useRouter, useSearchParams } from "next/navigation"

import { ActivityTab } from "@/components/friends/ActivityTab"
import { FindPeopleTab } from "@/components/friends/FindPeopleTab"
import { FriendsTab } from "@/components/friends/FriendsTab"
import { RequestsTab } from "@/components/friends/RequestsTab"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { useFriends } from "@/hooks/useFriends"
import { cn } from "@/lib/utils"

const tabs = [
  { id: "friends", label: "Friends" },
  { id: "requests", label: "Requests" },
  { id: "activity", label: "Activity" },
  { id: "find", label: "Find People" },
] as const

export default function FriendsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") ?? "friends") as (typeof tabs)[number]["id"]
  const { friends, friendRequests, sentRequests, removeFriend, acceptRequest, rejectRequest, cancelSentRequest } = useFriends()

  return (
    <AuthGuard>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
        <header>
          <h1 className="font-playfair text-4xl text-white">Friends</h1>
          <p className="mt-2 text-white/50">{friends.length} connections</p>
        </header>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => router.push(`/friends?tab=${tab.id}`)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-all",
                activeTab === tab.id
                  ? "border-[#C9A84C] bg-[#C9A84C] text-[#080808]"
                  : "border-white/10 bg-white/5 text-white/60",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "friends" ? (
          <FriendsTab
            friends={friends}
            onRemoveFriend={removeFriend}
            onOpenFindPeople={() => router.push("/friends?tab=find")}
          />
        ) : null}

        {activeTab === "requests" ? (
          <RequestsTab
            requests={friendRequests}
            sentRequests={sentRequests}
            onAccept={acceptRequest}
            onReject={rejectRequest}
            onCancelSent={cancelSentRequest}
          />
        ) : null}

        {activeTab === "activity" ? <ActivityTab /> : null}
        {activeTab === "find" ? <FindPeopleTab /> : null}
      </div>
    </AuthGuard>
  )
}
