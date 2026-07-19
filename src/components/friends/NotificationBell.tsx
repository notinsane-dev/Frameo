"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

import { trpc } from "@/lib/trpc/client"

export function NotificationBell() {
  const router = useRouter()
  const { data } = trpc.friends.getNotifications.useQuery(undefined, {
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const requestCount = data?.count ?? 0

  return (
    <button
      type="button"
      aria-label="Friend requests"
      onClick={() => router.push("/friends?tab=requests")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80"
    >
      <Bell className="h-4 w-4" />
      <AnimatePresence>
        {requestCount > 0 ? (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 16 }}
            className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#C9A84C] px-1 text-[10px] font-semibold text-black"
          >
            {requestCount}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </button>
  )
}
