import { TRPCError } from "@trpc/server"
import { and, avg, count, desc, eq, inArray, isNull, or } from "drizzle-orm"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import { db } from "@/lib/db"
import {
	activities,
	friendRequests,
	friendships,
	notifications,
	ratings,
	watchlists,
} from "@/lib/db/schema"
import {
	ensureAppUser,
	findUserById,
	findUserByUsername,
	findUsersByIds,
	isTemporaryUsername,
	searchUsers,
	user,
} from "@/lib/db/users"
import { protectedProcedure, publicProcedure, router } from "@/server/trpc"

function normalizeUser(
	profile: {
		id: string
		name?: string | null
		email?: string | null
		image?: string | null
		username?: string | null
		bio?: string | null
		createdAt?: Date
	},
	options?: { includeEmail?: boolean },
) {
	return {
		id: profile.id,
		name: profile.name ?? "Unknown User",
		image: profile.image ?? null,
		username: profile.username ?? null,
		bio: profile.bio ?? null,
		memberSince: profile.createdAt ?? new Date(),
		...(options?.includeEmail ? { email: profile.email ?? "" } : {}),
	}
}

async function getFriendshipStatus(currentUserId: string, targetUserId: string) {
	const friendship = await db.query.friendships.findFirst({
		where: and(eq(friendships.userId, currentUserId), eq(friendships.friendId, targetUserId)),
		columns: { id: true },
	})
	if (friendship) return "friends" as const

	const pendingSent = await db.query.friendRequests.findFirst({
		where: and(
			eq(friendRequests.senderId, currentUserId),
			eq(friendRequests.receiverId, targetUserId),
			eq(friendRequests.status, "pending"),
		),
		columns: { id: true },
	})
	if (pendingSent) return "pending_sent" as const

	const pendingReceived = await db.query.friendRequests.findFirst({
		where: and(
			eq(friendRequests.senderId, targetUserId),
			eq(friendRequests.receiverId, currentUserId),
			eq(friendRequests.status, "pending"),
		),
		columns: { id: true },
	})
	if (pendingReceived) return "pending_received" as const

	return "none" as const
}

export const friendsRouter = router({
	getInvitePreview: publicProcedure
		.input(z.object({ username: z.string().trim().min(3).max(20) }))
		.query(async ({ input }) => {
			const username = input.username.trim().toLowerCase()
			const inviter = await findUserByUsername(username)

			if (
				!inviter ||
				!inviter.username ||
				isTemporaryUsername(inviter.username) ||
				inviter.isPublic === false
			) {
				return { available: false as const, inviter: null }
			}

			return {
				available: true as const,
				inviter: {
					id: inviter.id,
					name: inviter.name,
					username: inviter.username,
					image: inviter.image,
				},
			}
		}),

	claimInvite: protectedProcedure
		.input(z.object({ username: z.string().trim().min(3).max(20) }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const username = input.username.trim().toLowerCase()
			const inviter = await findUserByUsername(username)

			if (
				!inviter ||
				!inviter.username ||
				isTemporaryUsername(inviter.username) ||
				inviter.isPublic === false
			) {
				return { status: "unavailable" as const }
			}

			if (inviter.id === currentUser.id) {
				return { status: "self" as const }
			}

			const status = await getFriendshipStatus(currentUser.id, inviter.id)
			if (status === "friends") {
				return {
					status: "already_friends" as const,
					inviterId: inviter.id,
					inviterUsername: inviter.username,
				}
			}

			if (status === "pending_sent") {
				return {
					status: "pending" as const,
					inviterId: inviter.id,
					inviterUsername: inviter.username,
				}
			}

			if (status === "pending_received") {
				const pending = await db.query.friendRequests.findFirst({
					where: and(
						eq(friendRequests.senderId, inviter.id),
						eq(friendRequests.receiverId, currentUser.id),
						eq(friendRequests.status, "pending"),
					),
				})
				if (pending) {
					const now = new Date()
					await db.transaction(async (tx) => {
						await tx
							.update(friendRequests)
							.set({ status: "accepted", updatedAt: now })
							.where(eq(friendRequests.id, pending.id))
						await tx
							.insert(friendships)
							.values([
								{
									userId: currentUser.id,
									friendId: inviter.id,
									createdAt: now,
								},
								{
									userId: inviter.id,
									friendId: currentUser.id,
									createdAt: now,
								},
							])
							.onConflictDoNothing({
								target: [friendships.userId, friendships.friendId],
							})
					})
					void Promise.all([
						logActivity({
							userId: currentUser.id,
							type: "became_friends",
							targetUserId: inviter.id,
							targetUserName: inviter.name,
						}),
						logActivity({
							userId: inviter.id,
							type: "became_friends",
							targetUserId: currentUser.id,
							targetUserName: currentUser.name,
						}),
					]).catch(() => undefined)
					return {
						status: "accepted" as const,
						inviterId: inviter.id,
						inviterUsername: inviter.username,
					}
				}
			}

			const now = new Date()
			const existingRequest = await db.query.friendRequests.findFirst({
				where: or(
					and(
						eq(friendRequests.senderId, currentUser.id),
						eq(friendRequests.receiverId, inviter.id),
					),
					and(
						eq(friendRequests.senderId, inviter.id),
						eq(friendRequests.receiverId, currentUser.id),
					),
				),
			})

			const payload = {
				senderId: currentUser.id,
				receiverId: inviter.id,
				senderName: currentUser.name,
				senderUsername: currentUser.username,
				senderImage: currentUser.image,
				receiverName: inviter.name,
				receiverUsername: inviter.username,
				receiverImage: inviter.image,
				status: "pending" as const,
				updatedAt: now,
			}

			if (existingRequest) {
				await db
					.update(friendRequests)
					.set(payload)
					.where(eq(friendRequests.id, existingRequest.id))
			} else {
				await db.insert(friendRequests).values({
					...payload,
					createdAt: now,
				})
			}

			void logActivity({
				userId: currentUser.id,
				type: "sent_request",
				targetUserId: inviter.id,
			}).catch(() => undefined)

			return {
				status: "requested" as const,
				inviterId: inviter.id,
				inviterUsername: inviter.username,
			}
		}),

	searchUsers: protectedProcedure
		.input(
			z.object({
				query: z.string().trim().min(2),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const users = await searchUsers(input.query, currentUser.id, 10)

			return Promise.all(
				users.map(async (profile) => {
					const friendStatus = await getFriendshipStatus(currentUser.id, profile.id)
					return {
						id: profile.id,
						name: profile.name ?? "Unknown User",
						image: profile.image ?? null,
						username: profile.username ?? null,
						friendshipStatus: friendStatus,
					}
				}),
			)
		}),

	sendFriendRequest: protectedProcedure
		.input(
			z.object({
				receiverId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const sender = await ensureAppUser(ctx.session.user)
			if (!sender) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const receiver = await findUserById(input.receiverId)
			if (!receiver) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Receiver user not found" })
			}

			if (sender.id === receiver.id) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot send a request to yourself" })
			}

			const existingFriendship = await db.query.friendships.findFirst({
				where: and(eq(friendships.userId, sender.id), eq(friendships.friendId, receiver.id)),
				columns: { id: true },
			})
			if (existingFriendship) {
				throw new TRPCError({ code: "CONFLICT", message: "You are already friends" })
			}

			const existingRequest = await db.query.friendRequests.findFirst({
				where: or(
					and(eq(friendRequests.senderId, sender.id), eq(friendRequests.receiverId, receiver.id)),
					and(eq(friendRequests.senderId, receiver.id), eq(friendRequests.receiverId, sender.id)),
				),
			})

			if (existingRequest?.status === "pending") {
				const isAlreadySentByCurrentUser = existingRequest.senderId === sender.id
				throw new TRPCError({
					code: "CONFLICT",
					message: isAlreadySentByCurrentUser
						? "Friend request already sent"
						: "This user already sent you a friend request",
				})
			}

			const now = new Date()
			const payload = {
				senderId: sender.id,
				receiverId: receiver.id,
				senderName: sender.name,
				senderUsername: sender.username,
				senderImage: sender.image,
				receiverName: receiver.name,
				receiverUsername: receiver.username,
				receiverImage: receiver.image,
				status: "pending" as const,
				updatedAt: now,
			}

			if (existingRequest) {
				// Reuse rejected/accepted row so unique(sender, receiver) does not block reconnect
				await db
					.update(friendRequests)
					.set(payload)
					.where(eq(friendRequests.id, existingRequest.id))
			} else {
				await db.insert(friendRequests).values({
					...payload,
					createdAt: now,
				})
			}

			void logActivity({
				userId: sender.id,
				type: "sent_request",
				targetUserId: receiver.id,
			}).catch(() => undefined)

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
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const requestId = Number.parseInt(input.requestId, 10)
			if (!Number.isInteger(requestId) || requestId <= 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found" })
			}

			const request = await db.query.friendRequests.findFirst({
				where: and(
					eq(friendRequests.id, requestId),
					eq(friendRequests.receiverId, currentUser.id),
					eq(friendRequests.status, "pending"),
				),
			})

			if (!request) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Friend request not found" })
			}

			const now = new Date()

			if (input.action === "reject") {
				await db
					.update(friendRequests)
					.set({ status: "rejected", updatedAt: now })
					.where(eq(friendRequests.id, request.id))
				return { success: true }
			}

			const senderId = request.senderId

			await db.transaction(async (tx) => {
				await tx
					.update(friendRequests)
					.set({ status: "accepted", updatedAt: now })
					.where(eq(friendRequests.id, request.id))

				await tx
					.insert(friendships)
					.values([
						{ userId: currentUser.id, friendId: senderId, createdAt: now },
						{ userId: senderId, friendId: currentUser.id, createdAt: now },
					])
					.onConflictDoNothing({ target: [friendships.userId, friendships.friendId] })
			})

			const [sender, receiver] = await Promise.all([
				findUserById(senderId),
				findUserById(currentUser.id),
			])

			await Promise.all([
				logActivity({
					userId: currentUser.id,
					type: "became_friends",
					targetUserId: senderId,
					targetUserName: sender?.name ?? "Friend",
				}),
				logActivity({
					userId: senderId,
					type: "became_friends",
					targetUserId: currentUser.id,
					targetUserName: receiver?.name ?? "Friend",
				}),
			])

			return { success: true }
		}),

	getFriendRequests: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const requests = await db
			.select()
			.from(friendRequests)
			.where(and(eq(friendRequests.receiverId, currentUser.id), eq(friendRequests.status, "pending")))
			.orderBy(desc(friendRequests.createdAt))

		const senderMap = await findUsersByIds(requests.map((request) => request.senderId))

		return requests.map((request) => {
			const sender = senderMap.get(request.senderId)
			const fallbackName =
				request.senderName || (request.senderUsername ? `@${request.senderUsername}` : "Unknown User")
			return {
				requestId: String(request.id),
				senderId: request.senderId,
				senderName: sender?.name ?? fallbackName,
				senderImage: sender?.image ?? request.senderImage ?? null,
				senderUsername: sender?.username ?? request.senderUsername ?? null,
				createdAt: request.createdAt,
			}
		})
	}),

	getSentRequests: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const requests = await db
			.select()
			.from(friendRequests)
			.where(and(eq(friendRequests.senderId, currentUser.id), eq(friendRequests.status, "pending")))
			.orderBy(desc(friendRequests.createdAt))

		const receiverMap = await findUsersByIds(requests.map((request) => request.receiverId))

		return requests.map((request) => {
			const receiver = receiverMap.get(request.receiverId)
			const fallbackName =
				request.receiverName ||
				(request.receiverUsername ? `@${request.receiverUsername}` : "Unknown User")
			return {
				requestId: String(request.id),
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
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const requestId = Number.parseInt(input.requestId, 10)
			if (!Number.isInteger(requestId) || requestId <= 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Sent request not found" })
			}

			const deleted = await db
				.delete(friendRequests)
				.where(
					and(
						eq(friendRequests.id, requestId),
						eq(friendRequests.senderId, currentUser.id),
						eq(friendRequests.status, "pending"),
					),
				)
				.returning({ id: friendRequests.id })

			if (deleted.length === 0) {
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
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const targetUserId = input?.userId ?? currentUser.id
			const isOwner = targetUserId === currentUser.id

			if (!isOwner) {
				const targetUser = await findUserById(targetUserId)
				if (!targetUser) {
					throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
				}

				const friendshipStatus = await getFriendshipStatus(currentUser.id, targetUserId)
				const isFriend = friendshipStatus === "friends"

				if (!isFriend && targetUser.isPublic === false) {
					throw new TRPCError({ code: "FORBIDDEN", message: "This profile is private" })
				}
			}

			const friendshipRows = await db
				.select()
				.from(friendships)
				.where(eq(friendships.userId, targetUserId))

			const friendIds = friendshipRows.map((friendship) => friendship.friendId)
			if (friendIds.length === 0) return []

			const [friends, watchlistCounts, ratingCounts] = await Promise.all([
				db
					.select({
						id: user.id,
						name: user.name,
						image: user.image,
						username: user.username,
						bio: user.bio,
					})
					.from(user)
					.where(inArray(user.id, friendIds)),
				db
					.select({
						userId: watchlists.userId,
						count: count(),
					})
					.from(watchlists)
					.where(inArray(watchlists.userId, friendIds))
					.groupBy(watchlists.userId),
				db
					.select({
						userId: ratings.userId,
						count: count(),
					})
					.from(ratings)
					.where(inArray(ratings.userId, friendIds))
					.groupBy(ratings.userId),
			])

			const watchlistMap = new Map(watchlistCounts.map((item) => [item.userId, Number(item.count)]))
			const ratingMap = new Map(ratingCounts.map((item) => [item.userId, Number(item.count)]))

			return friends.map((friend) => ({
				id: friend.id,
				name: friend.name ?? "Unknown User",
				image: friend.image ?? null,
				username: friend.username ?? null,
				bio: friend.bio ?? null,
				watchlistCount: watchlistMap.get(friend.id) ?? 0,
				ratingsCount: ratingMap.get(friend.id) ?? 0,
			}))
		}),

	removeFriend: protectedProcedure
		.input(
			z.object({
				friendId: z.string().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			await db.transaction(async (tx) => {
				await tx
					.delete(friendships)
					.where(
						or(
							and(eq(friendships.userId, currentUser.id), eq(friendships.friendId, input.friendId)),
							and(eq(friendships.userId, input.friendId), eq(friendships.friendId, currentUser.id)),
						),
					)

				// Clear request history so either side can send a new request later
				await tx
					.delete(friendRequests)
					.where(
						or(
							and(
								eq(friendRequests.senderId, currentUser.id),
								eq(friendRequests.receiverId, input.friendId),
							),
							and(
								eq(friendRequests.senderId, input.friendId),
								eq(friendRequests.receiverId, currentUser.id),
							),
						),
					)
			})

			return { success: true }
		}),

	getFriendActivity: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const friendshipRows = await db
			.select()
			.from(friendships)
			.where(eq(friendships.userId, currentUser.id))

		const friendIds = friendshipRows.map((friendship) => friendship.friendId)
		const activityUserIds = Array.from(new Set([currentUser.id, ...friendIds]))

		if (activityUserIds.length === 0) return []

		const activityRows = await db
			.select()
			.from(activities)
			.where(
				and(
					inArray(activities.userId, activityUserIds),
					inArray(activities.type, [
						"rated_movie",
						"added_watchlist",
						"removed_watchlist",
						"became_friends",
						"created_list",
						"agreed_review",
						"commented_review",
						"quoted_review",
					]),
				),
			)
			.orderBy(desc(activities.createdAt))
			.limit(50)

		const userMap = await findUsersByIds(activityUserIds)

		return activityRows.map((activity) => {
			const profile = userMap.get(activity.userId)
			return {
				id: String(activity.id),
				userId: activity.userId,
				userName: profile?.name ?? "Unknown User",
				userImage: profile?.image ?? null,
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
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const targetUser = await findUserById(input.userId)
			if (!targetUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const friendshipStatus = await getFriendshipStatus(currentUser.id, targetUser.id)
			const isFriend = friendshipStatus === "friends"
			const isOwner = currentUser.id === targetUser.id

			if (!isOwner && !isFriend && targetUser.isPublic === false) {
				throw new TRPCError({ code: "FORBIDDEN", message: "This profile is private" })
			}

			const canSeeRatings =
				isFriend || isOwner || targetUser.isPublic !== false

			const [watchlist, ratingRows, watchlistCountRows, ratingStats] = await Promise.all([
				db
					.select()
					.from(watchlists)
					.where(eq(watchlists.userId, targetUser.id))
					.orderBy(desc(watchlists.addedAt))
					.limit(10),
				canSeeRatings
					? db
							.select()
							.from(ratings)
							.where(eq(ratings.userId, targetUser.id))
							.orderBy(desc(ratings.updatedAt), desc(ratings.createdAt))
							.limit(10)
					: Promise.resolve([]),
				db
					.select({ count: count() })
					.from(watchlists)
					.where(eq(watchlists.userId, targetUser.id)),
				db
					.select({
						count: count(),
						avgRating: avg(ratings.rating),
					})
					.from(ratings)
					.where(eq(ratings.userId, targetUser.id)),
			])

			const ratingCount = Number(ratingStats[0]?.count ?? 0)
			const avgRating = ratingStats[0]?.avgRating
				? Number(Number(ratingStats[0].avgRating).toFixed(1))
				: 0

			return {
				user: normalizeUser(targetUser, { includeEmail: isOwner }),
				watchlist,
				ratings: ratingRows,
				stats: {
					watchlistCount: Number(watchlistCountRows[0]?.count ?? 0),
					ratingsCount: ratingCount,
					avgRating,
				},
				friendshipStatus,
			}
		}),

	getNotifications: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const [requests, unreadEngagement] = await Promise.all([
			db
				.select()
				.from(friendRequests)
				.where(
					and(
						eq(friendRequests.receiverId, currentUser.id),
						eq(friendRequests.status, "pending"),
					),
				)
				.orderBy(desc(friendRequests.createdAt)),
			db
				.select({ count: count() })
				.from(notifications)
				.where(and(eq(notifications.userId, currentUser.id), isNull(notifications.readAt))),
		])

		const requestCount = requests.length
		const engagementCount = Number(unreadEngagement[0]?.count ?? 0)

		return {
			count: requestCount + engagementCount,
			requestCount,
			engagementCount,
			requests: requests.map((request) => ({
				requestId: String(request.id),
				senderId: request.senderId,
				senderName: request.senderName ?? "Unknown User",
				senderUsername: request.senderUsername ?? null,
				senderImage: request.senderImage ?? null,
				createdAt: request.createdAt,
			})),
		}
	}),
})
