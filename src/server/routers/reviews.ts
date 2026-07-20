import { TRPCError } from "@trpc/server"
import {
	and,
	asc,
	cosineDistance,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	ne,
	sql,
} from "drizzle-orm"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"
import {
	commentLikes,
	notifications,
	ratings,
	reviewComments,
	reviewReactions,
	userEmbeddings,
} from "@/lib/db/schema"
import { ensureAppUser } from "@/lib/db/users"
import { getOrCreateUserEmbedding } from "@/lib/embeddings/users"
import { createNotification } from "@/lib/reviews/notifications"
import {
	canViewAuthorReviews,
	getFriendIds,
	isAuthorVisibleToViewer,
} from "@/lib/reviews/visibility"
import { protectedProcedure, router } from "@/server/trpc"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

async function loadReviewCard(ratingId: number, viewerId: string) {
	const [row] = await db
		.select({
			id: ratings.id,
			userId: ratings.userId,
			movieId: ratings.movieId,
			title: ratings.title,
			poster: ratings.poster,
			rating: ratings.rating,
			review: ratings.review,
			quotedRatingId: ratings.quotedRatingId,
			createdAt: ratings.createdAt,
			updatedAt: ratings.updatedAt,
			authorName: user.name,
			authorUsername: user.username,
			authorImage: user.image,
			authorIsPublic: user.isPublic,
		})
		.from(ratings)
		.innerJoin(user, eq(user.id, ratings.userId))
		.where(eq(ratings.id, ratingId))
		.limit(1)

	if (!row || !row.review?.trim()) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" })
	}

	const visible = await canViewAuthorReviews(viewerId, {
		id: row.userId,
		isPublic: row.authorIsPublic,
	})
	if (!visible) {
		throw new TRPCError({ code: "FORBIDDEN", message: "This review is private" })
	}

	const [agreeRows, disagreeRows, commentCountRows, viewerReaction, quoteSource] =
		await Promise.all([
			db
				.select({ count: count() })
				.from(reviewReactions)
				.where(and(eq(reviewReactions.ratingId, ratingId), eq(reviewReactions.type, "agree"))),
			db
				.select({ count: count() })
				.from(reviewReactions)
				.where(
					and(eq(reviewReactions.ratingId, ratingId), eq(reviewReactions.type, "disagree")),
				),
			db
				.select({ count: count() })
				.from(reviewComments)
				.where(eq(reviewComments.ratingId, ratingId)),
			db.query.reviewReactions.findFirst({
				where: and(eq(reviewReactions.ratingId, ratingId), eq(reviewReactions.userId, viewerId)),
				columns: { type: true },
			}),
			row.quotedRatingId
				? db
						.select({
							id: ratings.id,
							review: ratings.review,
							rating: ratings.rating,
							authorName: user.name,
							authorUsername: user.username,
						})
						.from(ratings)
						.innerJoin(user, eq(user.id, ratings.userId))
						.where(eq(ratings.id, row.quotedRatingId))
						.limit(1)
				: Promise.resolve([]),
		])

	const quoted = quoteSource[0]

	return {
		id: row.id,
		userId: row.userId,
		movieId: row.movieId,
		movieTitle: row.title,
		moviePoster: row.poster,
		rating: row.rating,
		review: row.review,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		author: {
			id: row.userId,
			name: row.authorName ?? "Unknown",
			username: row.authorUsername,
			image: row.authorImage,
		},
		agreeCount: Number(agreeRows[0]?.count ?? 0),
		disagreeCount: Number(disagreeRows[0]?.count ?? 0),
		commentCount: Number(commentCountRows[0]?.count ?? 0),
		viewerReaction: viewerReaction?.type ?? null,
		quotedReview: quoted?.review
			? {
					id: quoted.id,
					review: quoted.review,
					rating: quoted.rating,
					authorName: quoted.authorName ?? "Unknown",
					authorUsername: quoted.authorUsername,
				}
			: null,
	}
}

async function enrichReviewRows(
	rows: Array<{
		id: number
		userId: string
		movieId: number
		title: string
		poster: string | null
		rating: number
		review: string | null
		quotedRatingId: number | null
		createdAt: Date
		updatedAt: Date
		authorName: string | null
		authorUsername: string | null
		authorImage: string | null
		authorIsPublic: boolean | null
		distance?: number
	}>,
	viewerId: string,
	friendIds: Set<string>,
) {
	const visible = rows.filter(
		(row) =>
			row.review?.trim() &&
			isAuthorVisibleToViewer(row.userId, row.authorIsPublic, viewerId, friendIds),
	)
	if (visible.length === 0) return []

	const ids = visible.map((row) => row.id)

	const [reactionRows, commentRows, viewerReactions, quoteRows] = await Promise.all([
		db
			.select({
				ratingId: reviewReactions.ratingId,
				type: reviewReactions.type,
				count: count(),
			})
			.from(reviewReactions)
			.where(inArray(reviewReactions.ratingId, ids))
			.groupBy(reviewReactions.ratingId, reviewReactions.type),
		db
			.select({
				ratingId: reviewComments.ratingId,
				count: count(),
			})
			.from(reviewComments)
			.where(inArray(reviewComments.ratingId, ids))
			.groupBy(reviewComments.ratingId),
		db
			.select({
				ratingId: reviewReactions.ratingId,
				type: reviewReactions.type,
			})
			.from(reviewReactions)
			.where(and(inArray(reviewReactions.ratingId, ids), eq(reviewReactions.userId, viewerId))),
		(() => {
			const quoteIds = visible
				.map((r) => r.quotedRatingId)
				.filter((id): id is number => id != null)
			if (quoteIds.length === 0) return Promise.resolve([])
			return db
				.select({
					id: ratings.id,
					review: ratings.review,
					rating: ratings.rating,
					authorName: user.name,
					authorUsername: user.username,
				})
				.from(ratings)
				.innerJoin(user, eq(user.id, ratings.userId))
				.where(inArray(ratings.id, quoteIds))
		})(),
	])

	const agreeMap = new Map<number, number>()
	const disagreeMap = new Map<number, number>()
	for (const row of reactionRows) {
		if (row.type === "agree") agreeMap.set(row.ratingId, Number(row.count))
		else disagreeMap.set(row.ratingId, Number(row.count))
	}
	const commentMap = new Map(commentRows.map((row) => [row.ratingId, Number(row.count)]))
	const viewerMap = new Map(viewerReactions.map((row) => [row.ratingId, row.type]))
	const quoteMap = new Map(quoteRows.map((row) => [row.id, row]))

	return visible.map((row) => {
		const quoted = row.quotedRatingId ? quoteMap.get(row.quotedRatingId) : undefined
		return {
			id: row.id,
			userId: row.userId,
			movieId: row.movieId,
			movieTitle: row.title,
			moviePoster: row.poster,
			rating: row.rating,
			review: row.review!,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			author: {
				id: row.userId,
				name: row.authorName ?? "Unknown",
				username: row.authorUsername,
				image: row.authorImage,
			},
			agreeCount: agreeMap.get(row.id) ?? 0,
			disagreeCount: disagreeMap.get(row.id) ?? 0,
			commentCount: commentMap.get(row.id) ?? 0,
			viewerReaction: viewerMap.get(row.id) ?? null,
			tasteDistance: row.distance ?? null,
			quotedReview: quoted?.review
				? {
						id: quoted.id,
						review: quoted.review,
						rating: quoted.rating,
						authorName: quoted.authorName ?? "Unknown",
						authorUsername: quoted.authorUsername,
					}
				: null,
		}
	})
}

export const reviewsRouter = router({
	listForMovie: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
				limit: z.number().int().min(1).max(50).default(20),
				cursor: z.number().int().positive().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const friendIds = new Set(await getFriendIds(currentUser.id))

			const rows = await db
				.select({
					id: ratings.id,
					userId: ratings.userId,
					movieId: ratings.movieId,
					title: ratings.title,
					poster: ratings.poster,
					rating: ratings.rating,
					review: ratings.review,
					quotedRatingId: ratings.quotedRatingId,
					createdAt: ratings.createdAt,
					updatedAt: ratings.updatedAt,
					authorName: user.name,
					authorUsername: user.username,
					authorImage: user.image,
					authorIsPublic: user.isPublic,
				})
				.from(ratings)
				.innerJoin(user, eq(user.id, ratings.userId))
				.where(
					and(
						eq(ratings.movieId, input.movieId),
						isNotNull(ratings.review),
						ne(ratings.review, ""),
						input.cursor ? sql`${ratings.id} < ${input.cursor}` : undefined,
					),
				)
				.orderBy(desc(ratings.updatedAt), desc(ratings.id))
				.limit(input.limit + 15)

			const items = await enrichReviewRows(rows, currentUser.id, friendIds)
			const limited = items.slice(0, input.limit)
			const nextCursor =
				limited.length === input.limit ? limited[limited.length - 1]?.id : undefined

			return { items: limited, nextCursor }
		}),

	listTasteMatched: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
				limit: z.number().int().min(1).max(20).default(8),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const embedding = await getOrCreateUserEmbedding(currentUser.id)
			if (!embedding) {
				return { items: [], message: "Rate a few movies to unlock taste-matched reviews." }
			}

			const friendIds = new Set(await getFriendIds(currentUser.id))
			const distance = cosineDistance(userEmbeddings.embedding, embedding)

			const twinAuthors = await db
				.select({
					userId: userEmbeddings.userId,
					distance,
					isPublic: user.isPublic,
				})
				.from(userEmbeddings)
				.innerJoin(user, eq(user.id, userEmbeddings.userId))
				.where(ne(userEmbeddings.userId, currentUser.id))
				.orderBy(distance)
				.limit(40)

			const visibleAuthorIds = twinAuthors
				.filter((twin) =>
					isAuthorVisibleToViewer(twin.userId, twin.isPublic, currentUser.id, friendIds),
				)
				.map((twin) => twin.userId)

			if (visibleAuthorIds.length === 0) {
				return { items: [], message: null }
			}

			const distanceByUser = new Map(
				twinAuthors.map((twin) => [twin.userId, Number(twin.distance)]),
			)

			const rows = await db
				.select({
					id: ratings.id,
					userId: ratings.userId,
					movieId: ratings.movieId,
					title: ratings.title,
					poster: ratings.poster,
					rating: ratings.rating,
					review: ratings.review,
					quotedRatingId: ratings.quotedRatingId,
					createdAt: ratings.createdAt,
					updatedAt: ratings.updatedAt,
					authorName: user.name,
					authorUsername: user.username,
					authorImage: user.image,
					authorIsPublic: user.isPublic,
				})
				.from(ratings)
				.innerJoin(user, eq(user.id, ratings.userId))
				.where(
					and(
						eq(ratings.movieId, input.movieId),
						isNotNull(ratings.review),
						ne(ratings.review, ""),
						inArray(ratings.userId, visibleAuthorIds),
					),
				)
				.limit(input.limit * 2)

			const withDistance = rows
				.map((row) => ({
					...row,
					distance: distanceByUser.get(row.userId) ?? 99,
				}))
				.sort((a, b) => a.distance - b.distance)
				.slice(0, input.limit)

			const items = await enrichReviewRows(withDistance, currentUser.id, friendIds)
			return { items, message: items.length ? null : "No taste-matched reviews for this title yet." }
		}),

	getPopularWeek: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(20).default(8),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const limit = input?.limit ?? 8
			const since = new Date(Date.now() - WEEK_MS)
			const friendIds = new Set(await getFriendIds(currentUser.id))

			const popularAgreeRows = await db
				.select({
					ratingId: reviewReactions.ratingId,
					agreeCount: count(),
				})
				.from(reviewReactions)
				.where(
					and(eq(reviewReactions.type, "agree"), gte(reviewReactions.createdAt, since)),
				)
				.groupBy(reviewReactions.ratingId)
				.orderBy(desc(count()))
				.limit(limit * 3)

			const popularRatingIds = popularAgreeRows.map((row) => row.ratingId)
			let popularReviews: Awaited<ReturnType<typeof enrichReviewRows>> = []

			if (popularRatingIds.length > 0) {
				const rows = await db
					.select({
						id: ratings.id,
						userId: ratings.userId,
						movieId: ratings.movieId,
						title: ratings.title,
						poster: ratings.poster,
						rating: ratings.rating,
						review: ratings.review,
						quotedRatingId: ratings.quotedRatingId,
						createdAt: ratings.createdAt,
						updatedAt: ratings.updatedAt,
						authorName: user.name,
						authorUsername: user.username,
						authorImage: user.image,
						authorIsPublic: user.isPublic,
					})
					.from(ratings)
					.innerJoin(user, eq(user.id, ratings.userId))
					.where(
						and(
							inArray(ratings.id, popularRatingIds),
							isNotNull(ratings.review),
							ne(ratings.review, ""),
						),
					)

				const agreeOrder = new Map(
					popularAgreeRows.map((row, index) => [row.ratingId, index]),
				)
				const sorted = [...rows].sort(
					(a, b) => (agreeOrder.get(a.id) ?? 99) - (agreeOrder.get(b.id) ?? 99),
				)
				popularReviews = (await enrichReviewRows(sorted, currentUser.id, friendIds)).slice(
					0,
					limit,
				)
			}

			const popularCommentLikeRows = await db
				.select({
					commentId: commentLikes.commentId,
					likeCount: count(),
				})
				.from(commentLikes)
				.where(gte(commentLikes.createdAt, since))
				.groupBy(commentLikes.commentId)
				.orderBy(desc(count()))
				.limit(limit * 3)

			const commentIds = popularCommentLikeRows.map((row) => row.commentId)
			let popularComments: Array<{
				id: number
				body: string
				createdAt: Date
				likeCount: number
				viewerHasLiked: boolean
				author: {
					id: string
					name: string
					username: string | null
					image: string | null
				}
				review: {
					id: number
					movieId: number
					movieTitle: string
					moviePoster: string | null
					rating: number
					review: string
				}
			}> = []

			if (commentIds.length > 0) {
				const simpleComments = await db
					.select({
						id: reviewComments.id,
						body: reviewComments.body,
						createdAt: reviewComments.createdAt,
						authorId: reviewComments.userId,
						authorName: user.name,
						authorUsername: user.username,
						authorImage: user.image,
						ratingId: ratings.id,
						ratingUserId: ratings.userId,
						movieId: ratings.movieId,
						movieTitle: ratings.title,
						moviePoster: ratings.poster,
						rating: ratings.rating,
						review: ratings.review,
					})
					.from(reviewComments)
					.innerJoin(user, eq(user.id, reviewComments.userId))
					.innerJoin(ratings, eq(ratings.id, reviewComments.ratingId))
					.where(inArray(reviewComments.id, commentIds))

				const ratingAuthors = await db
					.select({
						id: user.id,
						isPublic: user.isPublic,
					})
					.from(user)
					.where(inArray(user.id, simpleComments.map((c) => c.ratingUserId)))

				const authorPublic = new Map(ratingAuthors.map((a) => [a.id, a.isPublic]))
				const likeOrder = new Map(
					popularCommentLikeRows.map((row, index) => [row.commentId, index]),
				)
				const likeCountMap = new Map(
					popularCommentLikeRows.map((row) => [row.commentId, Number(row.likeCount)]),
				)

				const viewerLikes = await db
					.select({ commentId: commentLikes.commentId })
					.from(commentLikes)
					.where(
						and(
							inArray(commentLikes.commentId, commentIds),
							eq(commentLikes.userId, currentUser.id),
						),
					)
				const likedSet = new Set(viewerLikes.map((row) => row.commentId))

				popularComments = simpleComments
					.filter(
						(row) =>
							row.review?.trim() &&
							isAuthorVisibleToViewer(
								row.ratingUserId,
								authorPublic.get(row.ratingUserId),
								currentUser.id,
								friendIds,
							),
					)
					.sort((a, b) => (likeOrder.get(a.id) ?? 99) - (likeOrder.get(b.id) ?? 99))
					.slice(0, limit)
					.map((row) => ({
						id: row.id,
						body: row.body,
						createdAt: row.createdAt,
						likeCount: likeCountMap.get(row.id) ?? 0,
						viewerHasLiked: likedSet.has(row.id),
						author: {
							id: row.authorId,
							name: row.authorName ?? "Unknown",
							username: row.authorUsername,
							image: row.authorImage,
						},
						review: {
							id: row.ratingId,
							movieId: row.movieId,
							movieTitle: row.movieTitle,
							moviePoster: row.moviePoster,
							rating: row.rating,
							review: row.review!,
						},
					}))
			}

			return { reviews: popularReviews, comments: popularComments }
		}),

	getById: protectedProcedure
		.input(z.object({ ratingId: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}
			return loadReviewCard(input.ratingId, currentUser.id)
		}),

	listForAuthor: protectedProcedure
		.input(
			z.object({
				userId: z.string().min(1),
				limit: z.number().int().min(1).max(30).default(12),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const author = await db.query.user.findFirst({
				where: eq(user.id, input.userId),
				columns: { id: true, isPublic: true },
			})
			if (!author) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const visible = await canViewAuthorReviews(currentUser.id, author)
			if (!visible) {
				throw new TRPCError({ code: "FORBIDDEN", message: "This profile is private" })
			}

			const friendIds = new Set(await getFriendIds(currentUser.id))
			const rows = await db
				.select({
					id: ratings.id,
					userId: ratings.userId,
					movieId: ratings.movieId,
					title: ratings.title,
					poster: ratings.poster,
					rating: ratings.rating,
					review: ratings.review,
					quotedRatingId: ratings.quotedRatingId,
					createdAt: ratings.createdAt,
					updatedAt: ratings.updatedAt,
					authorName: user.name,
					authorUsername: user.username,
					authorImage: user.image,
					authorIsPublic: user.isPublic,
				})
				.from(ratings)
				.innerJoin(user, eq(user.id, ratings.userId))
				.where(
					and(
						eq(ratings.userId, input.userId),
						isNotNull(ratings.review),
						ne(ratings.review, ""),
					),
				)
				.orderBy(desc(ratings.updatedAt))
				.limit(input.limit)

			return enrichReviewRows(rows, currentUser.id, friendIds)
		}),

	getQuoteSource: protectedProcedure
		.input(z.object({ ratingId: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}
			const card = await loadReviewCard(input.ratingId, currentUser.id)
			return {
				id: card.id,
				movieId: card.movieId,
				movieTitle: card.movieTitle,
				moviePoster: card.moviePoster,
				rating: card.rating,
				review: card.review,
				authorName: card.author.name,
				authorUsername: card.author.username,
			}
		}),

	setReaction: protectedProcedure
		.input(
			z.object({
				ratingId: z.number().int().positive(),
				type: z.enum(["agree", "disagree", "clear"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const card = await loadReviewCard(input.ratingId, currentUser.id)

			if (input.type === "clear") {
				await db
					.delete(reviewReactions)
					.where(
						and(
							eq(reviewReactions.ratingId, input.ratingId),
							eq(reviewReactions.userId, currentUser.id),
						),
					)
				return loadReviewCard(input.ratingId, currentUser.id)
			}

			await db
				.insert(reviewReactions)
				.values({
					ratingId: input.ratingId,
					userId: currentUser.id,
					type: input.type,
				})
				.onConflictDoUpdate({
					target: [reviewReactions.ratingId, reviewReactions.userId],
					set: { type: input.type, createdAt: new Date() },
				})

			await createNotification({
				userId: card.userId,
				actorId: currentUser.id,
				type: input.type === "agree" ? "review_agree" : "review_disagree",
				ratingId: card.id,
				movieId: card.movieId,
				movieTitle: card.movieTitle,
			})

			if (input.type === "agree") {
				await logActivity({
					userId: currentUser.id,
					type: "agreed_review",
					movieId: card.movieId,
					movieTitle: card.movieTitle,
					moviePoster: card.moviePoster ?? undefined,
					targetUserId: card.userId,
					targetUserName: card.author.name,
				})
			}

			return loadReviewCard(input.ratingId, currentUser.id)
		}),

	listComments: protectedProcedure
		.input(
			z.object({
				ratingId: z.number().int().positive(),
				limit: z.number().int().min(1).max(50).default(30),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			await loadReviewCard(input.ratingId, currentUser.id)

			const rows = await db
				.select({
					id: reviewComments.id,
					body: reviewComments.body,
					createdAt: reviewComments.createdAt,
					userId: reviewComments.userId,
					authorName: user.name,
					authorUsername: user.username,
					authorImage: user.image,
				})
				.from(reviewComments)
				.innerJoin(user, eq(user.id, reviewComments.userId))
				.where(eq(reviewComments.ratingId, input.ratingId))
				.orderBy(asc(reviewComments.createdAt))
				.limit(input.limit)

			if (rows.length === 0) return []

			const ids = rows.map((row) => row.id)
			const [likeCounts, viewerLikes] = await Promise.all([
				db
					.select({
						commentId: commentLikes.commentId,
						count: count(),
					})
					.from(commentLikes)
					.where(inArray(commentLikes.commentId, ids))
					.groupBy(commentLikes.commentId),
				db
					.select({ commentId: commentLikes.commentId })
					.from(commentLikes)
					.where(
						and(inArray(commentLikes.commentId, ids), eq(commentLikes.userId, currentUser.id)),
					),
			])

			const likeMap = new Map(likeCounts.map((row) => [row.commentId, Number(row.count)]))
			const likedSet = new Set(viewerLikes.map((row) => row.commentId))

			return rows.map((row) => ({
				id: row.id,
				body: row.body,
				createdAt: row.createdAt,
				likeCount: likeMap.get(row.id) ?? 0,
				viewerHasLiked: likedSet.has(row.id),
				author: {
					id: row.userId,
					name: row.authorName ?? "Unknown",
					username: row.authorUsername,
					image: row.authorImage,
				},
			}))
		}),

	addComment: protectedProcedure
		.input(
			z.object({
				ratingId: z.number().int().positive(),
				body: z.string().trim().min(1).max(500),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const card = await loadReviewCard(input.ratingId, currentUser.id)
			const now = new Date()

			const [comment] = await db
				.insert(reviewComments)
				.values({
					ratingId: input.ratingId,
					userId: currentUser.id,
					body: input.body,
					createdAt: now,
					updatedAt: now,
				})
				.returning()

			await createNotification({
				userId: card.userId,
				actorId: currentUser.id,
				type: "review_comment",
				ratingId: card.id,
				commentId: comment.id,
				movieId: card.movieId,
				movieTitle: card.movieTitle,
			})

			await logActivity({
				userId: currentUser.id,
				type: "commented_review",
				movieId: card.movieId,
				movieTitle: card.movieTitle,
				moviePoster: card.moviePoster ?? undefined,
				targetUserId: card.userId,
				targetUserName: card.author.name,
			})

			return {
				id: comment.id,
				body: comment.body,
				createdAt: comment.createdAt,
				likeCount: 0,
				viewerHasLiked: false,
				author: {
					id: currentUser.id,
					name: currentUser.name ?? "Unknown",
					username: currentUser.username,
					image: currentUser.image,
				},
			}
		}),

	deleteComment: protectedProcedure
		.input(z.object({ commentId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const deleted = await db
				.delete(reviewComments)
				.where(
					and(eq(reviewComments.id, input.commentId), eq(reviewComments.userId, currentUser.id)),
				)
				.returning({ id: reviewComments.id })

			if (deleted.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" })
			}

			return { success: true }
		}),

	likeComment: protectedProcedure
		.input(z.object({ commentId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const [comment] = await db
				.select({
					id: reviewComments.id,
					ratingId: reviewComments.ratingId,
				})
				.from(reviewComments)
				.where(eq(reviewComments.id, input.commentId))
				.limit(1)

			if (!comment) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" })
			}

			await loadReviewCard(comment.ratingId, currentUser.id)

			await db
				.insert(commentLikes)
				.values({
					commentId: input.commentId,
					userId: currentUser.id,
				})
				.onConflictDoNothing()

			return { success: true }
		}),

	unlikeComment: protectedProcedure
		.input(z.object({ commentId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			await db
				.delete(commentLikes)
				.where(
					and(
						eq(commentLikes.commentId, input.commentId),
						eq(commentLikes.userId, currentUser.id),
					),
				)

			return { success: true }
		}),

	listNotifications: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(50).default(20),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const rows = await db
				.select({
					id: notifications.id,
					type: notifications.type,
					ratingId: notifications.ratingId,
					commentId: notifications.commentId,
					movieId: notifications.movieId,
					movieTitle: notifications.movieTitle,
					readAt: notifications.readAt,
					createdAt: notifications.createdAt,
					actorId: notifications.actorId,
					actorName: user.name,
					actorUsername: user.username,
					actorImage: user.image,
				})
				.from(notifications)
				.innerJoin(user, eq(user.id, notifications.actorId))
				.where(eq(notifications.userId, currentUser.id))
				.orderBy(desc(notifications.createdAt))
				.limit(input?.limit ?? 20)

			const unreadCount = await db
				.select({ count: count() })
				.from(notifications)
				.where(and(eq(notifications.userId, currentUser.id), sql`${notifications.readAt} IS NULL`))

			return {
				items: rows.map((row) => ({
					id: row.id,
					type: row.type,
					ratingId: row.ratingId,
					commentId: row.commentId,
					movieId: row.movieId,
					movieTitle: row.movieTitle,
					readAt: row.readAt,
					createdAt: row.createdAt,
					actor: {
						id: row.actorId,
						name: row.actorName ?? "Someone",
						username: row.actorUsername,
						image: row.actorImage,
					},
				})),
				unreadCount: Number(unreadCount[0]?.count ?? 0),
			}
		}),

	markNotificationsRead: protectedProcedure
		.input(
			z
				.object({
					ids: z.array(z.number().int().positive()).optional(),
				})
				.optional(),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const now = new Date()

			if (input?.ids?.length) {
				await db
					.update(notifications)
					.set({ readAt: now })
					.where(
						and(
							eq(notifications.userId, currentUser.id),
							inArray(notifications.id, input.ids),
						),
					)
			} else {
				await db
					.update(notifications)
					.set({ readAt: now })
					.where(
						and(eq(notifications.userId, currentUser.id), sql`${notifications.readAt} IS NULL`),
					)
			}

			return { success: true }
		}),
})
