import { TRPCError } from "@trpc/server"
import { and, desc, eq, ne } from "drizzle-orm"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import cloudinary from "@/lib/cloudinary/client"
import { db } from "@/lib/db"
import { ratings, watchlists } from "@/lib/db/schema"
import { createNotification } from "@/lib/reviews/notifications"
import { canViewAuthorReviews } from "@/lib/reviews/visibility"
import {
	USERNAME_REGEX,
	ensureAppUser,
	isFirstUsernameSetup,
	user,
} from "@/lib/db/users"
import { ensureMovieEmbeddedFromMetadata } from "@/lib/embeddings/movies"
import { refreshUserTaste } from "@/lib/embeddings/users"
import { invalidateRecommendationCache } from "@/lib/recommendations/cache"
import { STREAMING_PROVIDERS } from "@/lib/streaming/providers"
import { protectedProcedure, publicProcedure, router } from "@/server/trpc"

const watchlistInput = z.object({
	movieId: z.number().int().positive(),
	title: z.string().trim().min(1),
	poster: z.string().optional(),
	overview: z.string().optional(),
	voteAverage: z.number().optional(),
	releaseDate: z.string().optional(),
})

const ratingInput = z.object({
	movieId: z.number().int().positive(),
	title: z.string().trim().min(1),
	poster: z.string().optional(),
	rating: z.number().min(0.5).max(10).multipleOf(0.5),
	review: z.string().trim().optional(),
	quotedRatingId: z.number().int().positive().optional(),
})

const updateProfileInput = z.object({
	name: z.string().trim().min(1).max(60).optional(),
	bio: z.string().trim().max(200).optional(),
	username: z.string().trim().min(3).max(20).optional(),
	isPublic: z.boolean().optional(),
	streamingServices: z.array(z.string().trim().min(1)).max(20).optional(),
})

const USERNAME_CHANGE_COOLDOWN_DAYS = 30

function canChangeUsername(lastUpdated?: Date | null) {
	if (!lastUpdated) return true
	const now = Date.now()
	const diff = now - new Date(lastUpdated).getTime()
	return diff >= USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
}

export const userRouter = router({
	checkUsernameAvailable: publicProcedure
		.input(
			z.object({
				username: z.string().trim().min(1),
			}),
		)
		.query(async ({ input }) => {
			const username = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(username)) {
				return {
					available: false,
					message: "Only letters, numbers, and underscores (3-20 chars)",
				}
			}

			const existingUser = await db.query.user.findFirst({
				where: eq(user.username, username),
				columns: { id: true },
			})

			if (existingUser) {
				return { available: false, message: "Username taken" }
			}

			return { available: true, message: "Available" }
		}),

	setUsername: protectedProcedure
		.input(
			z.object({
				username: z.string().trim().min(1),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const username = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(username)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Username must be 3-20 characters and contain only letters, numbers, and underscores",
				})
			}

			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const hasChanged = (currentUser.username || "") !== username
			const isFirstSetup = isFirstUsernameSetup(currentUser)
			if (hasChanged && !isFirstSetup && !canChangeUsername(currentUser.usernameUpdatedAt)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Username can only be changed once every 30 days",
				})
			}

			const existingUser = await db.query.user.findFirst({
				where: and(eq(user.username, username), ne(user.id, currentUser.id)),
				columns: { id: true },
			})

			if (existingUser) {
				throw new TRPCError({ code: "CONFLICT", message: "Username is already taken" })
			}

			const now = new Date()
			await db
				.update(user)
				.set({
					username,
					displayUsername: username,
					usernameIsTemporary: false,
					usernameUpdatedAt: hasChanged || isFirstSetup ? now : currentUser.usernameUpdatedAt,
					updatedAt: now,
				})
				.where(eq(user.id, currentUser.id))

			return { success: true }
		}),

	getWatchlist: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		return db
			.select()
			.from(watchlists)
			.where(eq(watchlists.userId, currentUser.id))
			.orderBy(desc(watchlists.addedAt))
	}),

	addToWatchlist: protectedProcedure.input(watchlistInput).mutation(async ({ ctx, input }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const now = new Date()
		const [watchlistItem] = await db
			.insert(watchlists)
			.values({
				userId: currentUser.id,
				movieId: input.movieId,
				title: input.title,
				poster: input.poster,
				overview: input.overview,
				voteAverage: input.voteAverage,
				releaseDate: input.releaseDate,
				addedAt: now,
			})
			.onConflictDoUpdate({
				target: [watchlists.userId, watchlists.movieId],
				set: {
					title: input.title,
					poster: input.poster,
					overview: input.overview,
					voteAverage: input.voteAverage,
					releaseDate: input.releaseDate,
				},
			})
			.returning()

		await logActivity({
			userId: currentUser.id,
			type: "added_watchlist",
			movieId: input.movieId,
			movieTitle: input.title,
			moviePoster: input.poster,
		})

		void ensureMovieEmbeddedFromMetadata({
			tmdbId: input.movieId,
			title: input.title,
			overview: input.overview,
			poster: input.poster,
		})
			.then(() => refreshUserTaste(currentUser.id))
			.catch((error) => console.error("[user.addToWatchlist] taste refresh failed", error))

		return watchlistItem
	}),

	removeFromWatchlist: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const existing = await db.query.watchlists.findFirst({
				where: and(eq(watchlists.userId, currentUser.id), eq(watchlists.movieId, input.movieId)),
			})

			const deleted = await db
				.delete(watchlists)
				.where(and(eq(watchlists.userId, currentUser.id), eq(watchlists.movieId, input.movieId)))
				.returning({ id: watchlists.id })

			if (deleted.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Watchlist item not found" })
			}

			await logActivity({
				userId: currentUser.id,
				type: "removed_watchlist",
				movieId: input.movieId,
				movieTitle: existing?.title,
				moviePoster: existing?.poster ?? undefined,
			})

			void refreshUserTaste(currentUser.id).catch((error) =>
				console.error("[user.removeFromWatchlist] taste refresh failed", error),
			)

			return { success: true }
		}),

	getRatings: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		return db
			.select()
			.from(ratings)
			.where(eq(ratings.userId, currentUser.id))
			.orderBy(desc(ratings.updatedAt), desc(ratings.createdAt))
	}),

	rateMovie: protectedProcedure.input(ratingInput).mutation(async ({ ctx, input }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		let quotedRatingId: number | null = null
		let quoteSource: {
			id: number
			userId: string
			review: string | null
			title: string
			movieId: number
		} | null = null

		if (input.quotedRatingId) {
			const [source] = await db
				.select({
					id: ratings.id,
					userId: ratings.userId,
					review: ratings.review,
					title: ratings.title,
					movieId: ratings.movieId,
					authorIsPublic: user.isPublic,
				})
				.from(ratings)
				.innerJoin(user, eq(user.id, ratings.userId))
				.where(eq(ratings.id, input.quotedRatingId))
				.limit(1)

			if (!source?.review?.trim()) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Quoted review not found" })
			}

			const visible = await canViewAuthorReviews(currentUser.id, {
				id: source.userId,
				isPublic: source.authorIsPublic,
			})
			if (!visible) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Quoted review is private" })
			}

			quotedRatingId = source.id
			quoteSource = source
		}

		const now = new Date()
		const [rating] = await db
			.insert(ratings)
			.values({
				userId: currentUser.id,
				movieId: input.movieId,
				title: input.title,
				poster: input.poster,
				rating: input.rating,
				review: input.review,
				quotedRatingId,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [ratings.userId, ratings.movieId],
				set: {
					title: input.title,
					poster: input.poster,
					rating: input.rating,
					review: input.review,
					quotedRatingId,
					updatedAt: now,
				},
			})
			.returning()

		await logActivity({
			userId: currentUser.id,
			type: "rated_movie",
			movieId: input.movieId,
			movieTitle: input.title,
			moviePoster: input.poster,
			rating: input.rating,
		})

		if (quoteSource) {
			await createNotification({
				userId: quoteSource.userId,
				actorId: currentUser.id,
				type: "review_quote",
				ratingId: quoteSource.id,
				movieId: quoteSource.movieId,
				movieTitle: quoteSource.title,
			})
			await logActivity({
				userId: currentUser.id,
				type: "quoted_review",
				movieId: input.movieId,
				movieTitle: input.title,
				moviePoster: input.poster,
				targetUserId: quoteSource.userId,
			})
		}

		void ensureMovieEmbeddedFromMetadata({
			tmdbId: input.movieId,
			title: input.title,
			poster: input.poster,
		})
			.then(() => refreshUserTaste(currentUser.id))
			.catch((error) => console.error("[user.rateMovie] taste refresh failed", error))

		return rating
	}),

	resetRating: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const deleted = await db
				.delete(ratings)
				.where(and(eq(ratings.userId, currentUser.id), eq(ratings.movieId, input.movieId)))
				.returning({ id: ratings.id })

			if (deleted.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Rating not found" })
			}

			void refreshUserTaste(currentUser.id).catch((error) =>
				console.error("[user.resetRating] taste refresh failed", error),
			)

			return { success: true }
		}),

	getProfile: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		return {
			id: currentUser.id,
			name: currentUser.name,
			username: currentUser.username,
			image: currentUser.image,
			imagePublicId: currentUser.imagePublicId,
			bio: currentUser.bio,
			isPublic: currentUser.isPublic,
			email: currentUser.email,
			avatarUpdatedAt: currentUser.avatarUpdatedAt,
			streamingServices: currentUser.streamingServices ?? [],
			hiddenVibes: currentUser.hiddenVibes ?? [],
		}
	}),

	listStreamingProviders: protectedProcedure.query(() => {
		return { providers: STREAMING_PROVIDERS }
	}),

	updateStreamingServices: protectedProcedure
		.input(
			z.object({
				streamingServices: z.array(z.string().trim().min(1)).max(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const allowed = new Set<string>(STREAMING_PROVIDERS.map((provider) => provider.id))
			const streamingServices = Array.from(
				new Set(input.streamingServices.filter((id) => allowed.has(id))),
			)

			const [updated] = await db
				.update(user)
				.set({ streamingServices, updatedAt: new Date() })
				.where(eq(user.id, currentUser.id))
				.returning({
					streamingServices: user.streamingServices,
				})

			await invalidateRecommendationCache(currentUser.id)

			return updated
		}),

	updateProfile: protectedProcedure.input(updateProfileInput).mutation(async ({ ctx, input }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const updates: Partial<typeof user.$inferInsert> = {
			updatedAt: new Date(),
		}

		if (typeof input.name !== "undefined") {
			updates.name = input.name
		}

		if (typeof input.bio !== "undefined") {
			updates.bio = input.bio
		}

		if (typeof input.isPublic !== "undefined") {
			updates.isPublic = input.isPublic
		}

		if (typeof input.streamingServices !== "undefined") {
			const allowed = new Set<string>(STREAMING_PROVIDERS.map((provider) => provider.id))
			updates.streamingServices = Array.from(
				new Set(input.streamingServices.filter((id) => allowed.has(id))),
			)
		}

		if (typeof input.username !== "undefined") {
			const normalizedUsername = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(normalizedUsername)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Username must be 3-20 characters and only contain letters, numbers, and underscores",
				})
			}

			if (normalizedUsername !== currentUser.username) {
				if (!isFirstUsernameSetup(currentUser) && !canChangeUsername(currentUser.usernameUpdatedAt)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Username can only be changed once every 30 days",
					})
				}

				const existingUser = await db.query.user.findFirst({
					where: and(eq(user.username, normalizedUsername), ne(user.id, currentUser.id)),
					columns: { id: true },
				})

				if (existingUser) {
					throw new TRPCError({ code: "CONFLICT", message: "Username is already taken" })
				}

				updates.usernameUpdatedAt = new Date()
			}

			updates.username = normalizedUsername
			updates.displayUsername = normalizedUsername
			updates.usernameIsTemporary = false
		}

		const [updatedUser] = await db
			.update(user)
			.set(updates)
			.where(eq(user.id, currentUser.id))
			.returning()

		if (!updatedUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		if (typeof input.streamingServices !== "undefined") {
			await invalidateRecommendationCache(currentUser.id)
		}

		return updatedUser
	}),

	deleteAvatar: protectedProcedure.mutation(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)

		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		if (currentUser.imagePublicId) {
			await cloudinary.uploader.destroy(currentUser.imagePublicId)
		}

		await db
			.update(user)
			.set({
				image: null,
				imagePublicId: null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, currentUser.id))

		return { success: true }
	}),
})
