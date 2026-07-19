"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, X } from "lucide-react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { timeAgo } from "@/lib/utils"
import type { FriendRequest } from "@/types"

type FriendRequestCardProps = {
  request: FriendRequest
  onAccept: () => void
  onReject: () => void
  isLoading?: boolean
}

export function FriendRequestCard({ request, onAccept, onReject, isLoading = false }: FriendRequestCardProps) {
  return (
    <AnimatePresence>
      <motion.article
        layout
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -36 }}
        className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/4 p-4"
      >
        <AvatarUpload currentImage={request.senderImage} name={request.senderName} size="sm" editable={false} />

        <div className="min-w-0 flex-1">
          <p className="truncate font-dm-sans text-white">{request.senderName}</p>
          <p className="text-sm text-white/50">sent you a friend request</p>
          <p className="text-xs text-white/30">{timeAgo(request.createdAt)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg bg-[#C9A84C] px-3 py-1.5 text-sm font-medium text-[#080808] disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isLoading}
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white/80 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
        </div>
      </motion.article>
    </AnimatePresence>
  )
}
