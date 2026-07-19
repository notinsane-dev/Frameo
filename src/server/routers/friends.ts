import { TRPCError } from "@trpc/server"
import mongoose from "mongoose"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import { connectDB } from "@/lib/db/mongoose"
import ActivityModel from "@/models/Activity"
import FriendRequestModel from "@/models/FriendRequest"
import FriendshipModel from "@/models/Friendship"
import RatingModel from "@/models/Rating"
import UserModel from "@/models/User"
import WatchlistModel from "@/models/Watchlist"
import { protectedProcedure, router } from "@/server/trpc"

function toUsernameBase(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20)

  if (normalized.length >= 3) return normalized
  return "cineaiuser"
}

async function getUniqueUsername(base: string) {
  const normalizedBase = toUsernameBase(base)

  let candidate = normalizedBase
  let counter = 1

  while (counter <= 50) {
    const existing = await UserModel.findOne({ username: candidate }).select("_id").lean()
    if (!existing) {
      return candidate
    }

    const suffix = String(counter)
    const maxBaseLength = 20 - suffix.length - 1
    candidate = `${normalizedBase.slice(0, Math.max(3, maxBaseLength))}_${counter}`
    counter += 1
  }

  return `cineai_${Math.floor(Math.random() * 900 + 100)}`
}

async function getOrCreateAppUser(sessionUser: {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  username?: string | null
  emailVerified?: boolean | null
}) {
  const existing = await UserModel.findOne({
    $or: [{ _id: sessionUser.id }, { id: sessionUser.id }, ...(sessionUser.email ? [{ email: sessionUser.email }] : [])],
  }).lean()

  if (existing) {
    return existing
  }

  if (!sessionUser.email) {
    return null
  }

  const baseFromEmail = sessionUser.email.split("@")[0] || "cineaiuser"
  const preferredBase = sessionUser.username || baseFromEmail
  const username = await getUniqueUsername(preferredBase)

  const created = await UserModel.create({
    name: sessionUser.name || "Movie Lover",
    email: sessionUser.email.toLowerCase(),
    username,
    image: sessionUser.image || null,
    emailVerified: Boolean(sessionUser.emailVerified),
    authProvider: "email",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  return created.toObject()
}

async function getUsersByAnyId(rawIds: string[]) {
  const uniqueIds = Array.from(new Set(rawIds.filter(Boolean)))
  if (uniqueIds.length === 0) {
    return new Map<string, { _id: unknown; id?: string; name?: string | null; image?: string | null; username?: string | null }>()
  }

  const objectIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
  const users = await UserModel.find({
    $or: [
      ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      { id: { $in: uniqueIds } },
    ],
  })
    .select("name image username id")
    .lean()

  const map = new Map<string, { _id: unknown; id?: string; name?: string | null; image?: string | null; username?: string | null }>()
  for (const user of users) {
    const mongoId = String(user._id)
    map.set(mongoId, user)
    if (typeof user.id === "string" && user.id.length > 0) {
      map.set(user.id, user)
    }
  }

  return map
}

async function resolveUserByAnyId(userId: string) {
  const objectIds = mongoose.Types.ObjectId.isValid(userId) ? [userId] : []
  const user = await UserModel.findOne({
    $or: [
      ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
      { id: userId },
    ],
  })
    .select("name email image bio username isPublic createdAt")
    .lean()

  return user
}

function normalizeUser(user: { _id: unknown; name?: string | null; email?: string | null; image?: string | null; username?: string | null; bio?: string | null; createdAt?: Date }) {
  return {
    id: String(user._id),
    name: user.name ?? "Unknown User",
    email: user.email ?? "",
    image: user.image ?? null,
    username: user.username ?? null,
    bio: user.bio ?? null,
    memberSince: user.createdAt ?? new Date(),
  }
}

async function getFriendshipStatus(currentUserId: string, targetUserId: string) {
  const friendship = await FriendshipModel.findOne({ userId: currentUserId, friendId: targetUserId })
  if (friendship) return "friends" as const

  const pendingSent = await FriendRequestModel.findOne({
    senderId: currentUserId,
    receiverId: targetUserId,
    status: "pending",
  })
  if (pendingSent) return "pending_sent" as const

  const pendingReceived = await FriendRequestModel.findOne({
    senderId: targetUserId,
    receiverId: currentUserId,
    status: "pending",
  })
  if (pendingReceived) return "pending_received" as const

  return "none" as const
}

export const friendsRouter = router({
  searchUsers: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(2),
      }),
    )
    .query(async ({ ctx, input }) => {
      await connectDB()

    const currentUser = await getOrCreateAppUser(ctx.session.user)
    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const currentUserId = String(currentUser._id)
      const regex = new RegExp(input.query, "i")

      const users = await UserModel.find({
        _id: { $ne: currentUserId },
        $or: [{ name: regex }, { email: regex }, { username: regex }],
      })
        .select("name email image username")
        .limit(10)
        .lean()

      const mapped = await Promise.all(
        users.map(async (user) => {
          const friendStatus = await getFriendshipStatus(currentUserId, String(user._id))

          return {
            id: String(user._id),
            name: user.name ?? "Unknown User",
            image: user.image ?? null,
            username: user.username ?? null,
            friendshipStatus: friendStatus,
          }
        }),
      )

      return mapped
    }),

  sendFriendRequest: protectedProcedure
    .input(
      z.object({
        receiverId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await connectDB()

    const sender = await getOrCreateAppUser(ctx.session.user)
    if (!sender) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const senderId = String(sender._id)
      const { receiverId } = input
      const receiver = await UserModel.findOne({
        $or: [{ _id: receiverId }, { id: receiverId }],
      })
        .select("_id name username image")
        .lean()

      if (!receiver?._id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Receiver user not found" })
      }

      const normalizedReceiverId = String(receiver._id)

      if (senderId === normalizedReceiverId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot send a request to yourself" })
      }

      const [existingPendingRequest, existingFriendship] = await Promise.all([
        FriendRequestModel.findOne({
          $or: [
            { senderId, receiverId: normalizedReceiverId },
            { senderId: normalizedReceiverId, receiverId: senderId },
          ],
          status: "pending",
        })
          .select("_id senderId receiverId")
          .lean(),
        FriendshipModel.findOne({ userId: senderId, friendId: normalizedReceiverId }).select("_id").lean(),
      ])

      if (existingPendingRequest) {
        const isAlreadySentByCurrentUser = existingPendingRequest.senderId === senderId
        throw new TRPCError({
          code: "CONFLICT",
          message: isAlreadySentByCurrentUser
            ? "Friend request already sent"
            : "This user already sent you a friend request",
        })
      }

      if (existingFriendship) {
        throw new TRPCError({ code: "CONFLICT", message: "You are already friends" })
      }

      await FriendRequestModel.create({
        senderId,
        receiverId: normalizedReceiverId,
        senderName: sender.name,
        senderUsername: sender.username,
        senderImage: sender.image,
        receiverName: receiver.name,
        receiverUsername: receiver.username,
        receiverImage: receiver.image,
        status: "pending",
      })

      void logActivity({ userId: senderId, type: "sent_request", targetUserId: normalizedReceiverId }).catch(() => undefined)

      return { success: true }
    }),

  respondToRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().min(1),
        action: z.enum(["accept", "reject"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const currentUserId = String(currentUser._id)
      const request = await FriendRequestModel.findOne({
        _id: input.requestId,
        receiverId: currentUserId,
        status: "pending",
      })

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found" })
      }

      if (input.action === "reject") {
        request.status = "rejected"
        request.updatedAt = new Date()
        await request.save()
        return { success: true }
      }

      request.status = "accepted"
      request.updatedAt = new Date()
      await request.save()

      const senderId = request.senderId

      await FriendshipModel.bulkWrite([
        {
          updateOne: {
            filter: { userId: currentUserId, friendId: senderId },
            update: { $setOnInsert: { userId: currentUserId, friendId: senderId, createdAt: new Date() } },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { userId: senderId, friendId: currentUserId },
            update: { $setOnInsert: { userId: senderId, friendId: currentUserId, createdAt: new Date() } },
            upsert: true,
          },
        },
      ])

      const [sender, receiver] = await Promise.all([
        UserModel.findById(senderId).select("name").lean(),
        UserModel.findById(currentUserId).select("name").lean(),
      ])

      await Promise.all([
        logActivity({
          userId: currentUserId,
          type: "became_friends",
          targetUserId: senderId,
          targetUserName: sender?.name ?? "Friend",
        }),
        logActivity({
          userId: senderId,
          type: "became_friends",
          targetUserId: currentUserId,
          targetUserName: receiver?.name ?? "Friend",
        }),
      ])

      return { success: true }
    }),

  getFriendRequests: protectedProcedure.query(async ({ ctx }) => {
    await connectDB()

    const currentUser = await getOrCreateAppUser(ctx.session.user)
    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const currentUserId = String(currentUser._id)
    const requests = await FriendRequestModel.find({ receiverId: currentUserId, status: "pending" })
      .sort({ createdAt: -1 })
      .lean()

    const senderIds = requests.map((request) => request.senderId)
    const senderMap = await getUsersByAnyId(senderIds)

    return requests.map((request) => {
      const sender = senderMap.get(request.senderId)
      const fallbackName = request.senderName || (request.senderUsername ? `@${request.senderUsername}` : "Unknown User")
      return {
        requestId: String(request._id),
        senderId: request.senderId,
        senderName: sender?.name ?? fallbackName,
        senderImage: sender?.image ?? request.senderImage ?? null,
        senderUsername: sender?.username ?? request.senderUsername ?? null,
        createdAt: request.createdAt,
      }
    })
  }),

  getSentRequests: protectedProcedure.query(async ({ ctx }) => {
    await connectDB()

    const currentUser = await getOrCreateAppUser(ctx.session.user)
    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const currentUserId = String(currentUser._id)
    const requests = await FriendRequestModel.find({ senderId: currentUserId, status: "pending" })
      .sort({ createdAt: -1 })
      .lean()

    const receiverIds = requests.map((request) => request.receiverId)
    const receiverMap = await getUsersByAnyId(receiverIds)

    return requests.map((request) => {
      const receiver = receiverMap.get(request.receiverId)
      const fallbackName = request.receiverName || (request.receiverUsername ? `@${request.receiverUsername}` : "Unknown User")
      return {
        requestId: String(request._id),
        receiverId: request.receiverId,
        receiverName: receiver?.name ?? fallbackName,
        receiverImage: receiver?.image ?? request.receiverImage ?? null,
        receiverUsername: receiver?.username ?? request.receiverUsername ?? null,
        createdAt: request.createdAt,
      }
    })
  }),

  cancelSentRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const currentUserId = String(currentUser._id)
      const result = await FriendRequestModel.deleteOne({
        _id: input.requestId,
        senderId: currentUserId,
        status: "pending",
      })

      if (result.deletedCount === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sent request not found" })
      }

      return { success: true }
    }),

  getFriends: protectedProcedure
    .input(
      z
        .object({
          userId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const targetUserId = input?.userId ?? String(currentUser._id)
      const friendships = await FriendshipModel.find({ userId: targetUserId }).lean()
      const friendIds = friendships.map((friendship) => friendship.friendId)

      if (friendIds.length === 0) return []

      const [friends, watchlistCounts, ratingCounts] = await Promise.all([
        UserModel.find({ _id: { $in: friendIds } }).select("name image username bio").lean(),
        WatchlistModel.aggregate([
          { $match: { userId: { $in: friendIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
        ]),
        RatingModel.aggregate([
          { $match: { userId: { $in: friendIds } } },
          { $group: { _id: "$userId", count: { $sum: 1 } } },
        ]),
      ])

      const watchlistMap = new Map(watchlistCounts.map((item) => [String(item._id), item.count as number]))
      const ratingMap = new Map(ratingCounts.map((item) => [String(item._id), item.count as number]))

      return friends.map((friend) => {
        const id = String(friend._id)
        return {
          id,
          name: friend.name ?? "Unknown User",
          image: friend.image ?? null,
          username: friend.username ?? null,
          bio: friend.bio ?? null,
          watchlistCount: watchlistMap.get(id) ?? 0,
          ratingsCount: ratingMap.get(id) ?? 0,
        }
      })
    }),

  removeFriend: protectedProcedure
    .input(
      z.object({
        friendId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const currentUserId = String(currentUser._id)

      await FriendshipModel.deleteMany({
        $or: [
          { userId: currentUserId, friendId: input.friendId },
          { userId: input.friendId, friendId: currentUserId },
        ],
      })

      return { success: true }
    }),

  getFriendActivity: protectedProcedure.query(async ({ ctx }) => {
    await connectDB()

    const currentUser = await getOrCreateAppUser(ctx.session.user)
    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const currentUserId = String(currentUser._id)
    const friendships = await FriendshipModel.find({ userId: currentUserId }).lean()
    const friendIds = friendships.map((friendship) => friendship.friendId)
    const activityUserIds = Array.from(new Set([currentUserId, ctx.session.user.id, ...friendIds]))

    if (activityUserIds.length === 0) return []

    const activities = await ActivityModel.find({
      userId: { $in: activityUserIds },
      type: { $in: ["rated_movie", "added_watchlist", "removed_watchlist", "became_friends", "created_list"] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    const userMap = await getUsersByAnyId(activityUserIds)

    return activities.map((activity) => {
      const user = userMap.get(activity.userId)
      return {
        id: String(activity._id),
        userId: activity.userId,
        userName: user?.name ?? "Unknown User",
        userImage: user?.image ?? null,
        type: activity.type,
        movieId: activity.movieId,
        movieTitle: activity.movieTitle,
        moviePoster: activity.moviePoster,
        rating: activity.rating,
        targetUserId: activity.targetUserId,
        targetUserName: activity.targetUserName,
        createdAt: activity.createdAt,
      }
    })
  }),

  getFriendProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      await connectDB()

      const currentUser = await getOrCreateAppUser(ctx.session.user)
      if (!currentUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      }

      const currentUserId = String(currentUser._id)
      const targetUser = await resolveUserByAnyId(input.userId)
      if (!targetUser?._id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
      }

      const targetUserId = String(targetUser._id)
      const targetLookupIds = Array.from(
      new Set([
        targetUserId,
        input.userId,
        targetUser.id,
        targetUser.email,
      ].filter((value): value is string => Boolean(value))),
    )

      const friendshipStatus = await getFriendshipStatus(currentUserId, targetUserId)
      const isFriend = friendshipStatus === "friends"
      const isOwner = currentUserId === targetUserId

      if (!isOwner && !isFriend && targetUser.isPublic === false) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This profile is private" })
      }

      const [watchlist, ratings, watchlistCount, ratingStats] = await Promise.all([
        WatchlistModel.find({ userId: { $in: targetLookupIds } }).sort({ addedAt: -1 }).limit(10).lean(),
        isFriend || isOwner
          ? RatingModel.find({ userId: { $in: targetLookupIds } }).sort({ updatedAt: -1, createdAt: -1 }).limit(10).lean()
          : Promise.resolve([]),
        WatchlistModel.countDocuments({ userId: { $in: targetLookupIds } }),
        RatingModel.aggregate([
          { $match: { userId: { $in: targetLookupIds } } },
          { $group: { _id: null, count: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
        ]),
      ])

      const ratingCount = ratingStats[0]?.count ?? 0
      const avgRating = ratingStats[0]?.avgRating ? Number(ratingStats[0].avgRating.toFixed(1)) : 0

      return {
        user: normalizeUser(targetUser),
        watchlist,
        ratings,
        stats: {
          watchlistCount,
          ratingsCount: ratingCount,
          avgRating,
        },
        friendshipStatus,
      }
    }),

  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    await connectDB()

    const currentUser = await getOrCreateAppUser(ctx.session.user)
    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
    }

    const currentUserId = String(currentUser._id)
    const requests = await FriendRequestModel.find({
      receiverId: currentUserId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .lean()

    return {
      count: requests.length,
      requests: requests.map((request) => ({
        requestId: String(request._id),
        senderId: request.senderId,
        senderName: request.senderName ?? null,
        senderUsername: request.senderUsername ?? null,
        senderImage: request.senderImage ?? null,
        createdAt: request.createdAt,
      })),
    }
  }),
})
