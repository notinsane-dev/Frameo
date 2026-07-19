"use client"

import { motion } from "framer-motion"

import { ActivityFeedItem } from "@/components/friends/ActivityFeedItem"
import { trpc } from "@/lib/trpc/client"

function dayLabel(date: Date | string) {
  const target = new Date(date)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

export function ActivityTab() {
  const { data: activities = [], isLoading } = trpc.friends.getFriendActivity.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-16 rounded-xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (!activities.length) {
    return <p className="text-white/30">Add friends to see their activity here</p>
  }

  let currentLabel = ""

  return (
    <motion.div initial="hidden" animate="visible" className="relative border-l border-white/10 pl-4">
      <div className="space-y-4">
        {activities.map((activity) => {
          const label = dayLabel(activity.createdAt)
          const showLabel = label !== currentLabel
          currentLabel = label

          return (
            <div key={activity.id}>
              {showLabel ? <p className="mb-2 text-xs uppercase tracking-widest text-white/30">{label}</p> : null}
              <ActivityFeedItem activity={activity} />
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
