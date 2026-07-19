"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, Clock3, UserCheck, UserPlus } from "lucide-react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import type { UserSearchResult as UserSearchResultType } from "@/types"

type UserSearchResultProps = {
  user: UserSearchResultType
  onAction: () => void
}

function renderActionLabel(status: UserSearchResultType["friendshipStatus"]) {
  if (status === "pending_sent") return "Request Sent"
  if (status === "pending_received") return "Accept Request"
  if (status === "friends") return "Friends"
  return "Add Friend"
}

function renderIcon(status: UserSearchResultType["friendshipStatus"]) {
  if (status === "pending_sent") return <Clock3 className="h-4 w-4" />
  if (status === "pending_received") return <Check className="h-4 w-4" />
  if (status === "friends") return <UserCheck className="h-4 w-4" />
  return <UserPlus className="h-4 w-4" />
}

export function UserSearchResult({ user, onAction }: UserSearchResultProps) {
  const isDisabled = user.friendshipStatus === "pending_sent" || user.friendshipStatus === "friends"

  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <AvatarUpload currentImage={user.image} name={user.name} size="md" editable={false} />
        <div className="min-w-0">
          <p className="truncate text-white">{user.name}</p>
          <p className="truncate text-xs text-white/50">{user.username ? `@${user.username}` : "No username"}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.button
          key={user.friendshipStatus}
          initial={{ opacity: 0.7, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.7, scale: 0.98 }}
          type="button"
          disabled={isDisabled}
          onClick={onAction}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm ${
            user.friendshipStatus === "pending_received"
              ? "bg-[#C9A84C] text-[#080808]"
              : user.friendshipStatus === "none"
                ? "border border-[#C9A84C] text-[#C9A84C]"
                : "bg-white/10 text-white/40"
          }`}
        >
          {renderIcon(user.friendshipStatus)}
          {renderActionLabel(user.friendshipStatus)}
          {user.friendshipStatus === "friends" ? " ✓" : ""}
        </motion.button>
      </AnimatePresence>
    </article>
  )
}
