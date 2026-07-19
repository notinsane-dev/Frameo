"use client"

import { AnimatePresence, motion } from "framer-motion"
import { MoreHorizontal, User } from "lucide-react"
import { useState } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"

type Friend = {
  id: string
  name: string
  image: string | null
  username: string | null
  bio: string | null
}

type FriendCardProps = {
  friend: Friend
  onViewProfile: () => void
  onRemove: () => void
}

export function FriendCard({ friend, onViewProfile, onRemove }: FriendCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.article
      whileHover={{ y: -2, boxShadow: "0 14px 30px rgba(0,0,0,0.28)" }}
      className="relative rounded-xl border border-white/8 bg-white/4 p-4"
    >
      <div className="mb-3 flex items-center gap-3">
        <AvatarUpload currentImage={friend.image} name={friend.name} size="md" editable={false} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-white">{friend.name}</p>
          <p className="truncate text-xs text-white/50">@{friend.username || "cineai"}</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-white/10 bg-[#111111] p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onRemove()
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-300/80 hover:bg-white/5"
                >
                  Remove Friend
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {friend.bio ? <p className="mb-3 line-clamp-1 text-sm text-white/50">{friend.bio}</p> : null}

      <button
        type="button"
        onClick={onViewProfile}
        className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
      >
        <User className="h-4 w-4" />
        View Profile
      </button>
    </motion.article>
  )
}
