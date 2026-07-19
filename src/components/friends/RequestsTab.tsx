"use client"

import { AnimatePresence, motion } from "framer-motion"

import { FriendRequestCard } from "@/components/friends/FriendRequestCard"
import { timeAgo } from "@/lib/utils"
import type { FriendRequest } from "@/types"

type SentRequest = {
  requestId: string
  receiverId: string
  receiverName: string
  receiverImage: string | null
  receiverUsername: string | null
  createdAt: Date
}

type RequestsTabProps = {
  requests: FriendRequest[]
  sentRequests: SentRequest[]
  onAccept: (requestId: string) => Promise<void>
  onReject: (requestId: string) => Promise<void>
  onCancelSent: (requestId: string) => Promise<void>
}

export function RequestsTab({ requests, sentRequests, onAccept, onReject, onCancelSent }: RequestsTabProps) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-3 text-lg text-white">Received</h3>
        {!requests.length ? (
          <p className="text-white/30">No pending requests</p>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {requests.map((request) => (
                <FriendRequestCard
                  key={request.requestId}
                  request={request}
                  onAccept={() => onAccept(request.requestId)}
                  onReject={() => onReject(request.requestId)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-white">Sent</h3>
        {!sentRequests.length ? (
          <p className="text-white/30">No pending sent requests</p>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <motion.article
                  key={request.requestId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                      {request.receiverImage ? (
                        <img src={request.receiverImage} alt={request.receiverName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-white">{request.receiverName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white">{request.receiverName}</p>
                      <p className="text-xs text-white/40">Request pending • {timeAgo(request.createdAt)}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCancelSent(request.requestId)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </motion.article>
              ))}
            </div>
          </AnimatePresence>
        )}
      </section>
    </div>
  )
}
