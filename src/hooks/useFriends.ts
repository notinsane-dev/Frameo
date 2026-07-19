"use client"

import { useCallback } from "react"

import { useToastContext } from "@/components/shared/ToastProvider"
import { trpc } from "@/lib/trpc/client"
import type { Friend, FriendRequest } from "@/types"

export function useFriends() {
  const { showToast } = useToastContext()
  const utils = trpc.useUtils()

  const { data: friends = [], isLoading: friendsLoading } = trpc.friends.getFriends.useQuery()
  const { data: friendRequests = [], isLoading: requestsLoading } = trpc.friends.getFriendRequests.useQuery()
  const { data: sentRequests = [], isLoading: sentRequestsLoading } = trpc.friends.getSentRequests.useQuery()

  const sendRequestMutation = trpc.friends.sendFriendRequest.useMutation({
    onSuccess: async () => {
      showToast("Friend request sent!", "success")
      await Promise.all([
        utils.friends.getFriends.invalidate(),
        utils.friends.getFriendRequests.invalidate(),
        utils.friends.getSentRequests.invalidate(),
        utils.friends.getNotifications.invalidate(),
      ])
    },
  })

  const respondMutation = trpc.friends.respondToRequest.useMutation({
    onSuccess: async (_, variables) => {
      if (variables.action === "accept") {
        showToast("You are now friends! 🎉", "success")
      }

      await Promise.all([
        utils.friends.getFriends.invalidate(),
        utils.friends.getFriendRequests.invalidate(),
        utils.friends.getSentRequests.invalidate(),
        utils.friends.getNotifications.invalidate(),
      ])
    },
  })

  const removeFriendMutation = trpc.friends.removeFriend.useMutation({
    onSuccess: async () => {
      showToast("Friend removed", "info")
      await Promise.all([
        utils.friends.getFriends.invalidate(),
        utils.friends.getFriendRequests.invalidate(),
        utils.friends.getSentRequests.invalidate(),
        utils.friends.getNotifications.invalidate(),
      ])
    },
  })

  const cancelSentRequestMutation = trpc.friends.cancelSentRequest.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.friends.getFriends.invalidate(),
        utils.friends.getFriendRequests.invalidate(),
        utils.friends.getSentRequests.invalidate(),
        utils.friends.getNotifications.invalidate(),
      ])
    },
  })

  const sendRequest = useCallback(
    async (receiverId: string) => {
      await sendRequestMutation.mutateAsync({ receiverId })
    },
    [sendRequestMutation],
  )

  const acceptRequest = useCallback(
    async (requestId: string) => {
      await respondMutation.mutateAsync({ requestId, action: "accept" })
    },
    [respondMutation],
  )

  const rejectRequest = useCallback(
    async (requestId: string) => {
      await respondMutation.mutateAsync({ requestId, action: "reject" })
    },
    [respondMutation],
  )

  const removeFriend = useCallback(
    async (friendId: string) => {
      await removeFriendMutation.mutateAsync({ friendId })
    },
    [removeFriendMutation],
  )

  const cancelSentRequest = useCallback(
    async (requestId: string) => {
      await cancelSentRequestMutation.mutateAsync({ requestId })
    },
    [cancelSentRequestMutation],
  )

  return {
    friends: friends as Friend[],
    friendRequests: friendRequests as FriendRequest[],
    sentRequests,
    requestCount: friendRequests.length,
    isLoading: friendsLoading || requestsLoading || sentRequestsLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    cancelSentRequest,
  }
}
