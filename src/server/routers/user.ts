import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import cloudinary from "@/lib/cloudinary/client"
import { connectDB } from "@/lib/db/mongoose"
import RatingModel from "@/models/Rating"
import UserModel from "@/models/User"
import WatchlistModel from "@/models/Watchlist"
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
})

const updateProfileInput = z.object({
	name: z.string().trim().min(1).max(60).optional(),
	bio: z.string().trim().max(200).optional(),
	username: z.string().trim().min(3).max(20).optional(),
	isPublic: z.boolean().optional(),
})

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const USERNAME_CHANGE_COOLDOWN_DAYS = 30

function canChangeUsername(lastUpdated?: Date | null) {
	if (!lastUpdated) return true
	const now = Date.now()
	const diff = now - new Date(lastUpdated).getTime()
	return diff >= USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
}

function buildUserLookup(sessionUser: { id: string; email?: string | null }) {
	return {
		$or: [
			{ _id: sessionUser.id },
			{ id: sessionUser.id },
			...(sessionUser.email ? [{ email: sessionUser.email }] : []),
		],
	}
}

function toUsernameBase(input: string) {
	const normalized = input
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "")
		.slice(0, 20)

	if (normalized.length >= 3) return normalized
	return "cineaiuser"
}

function isTemporaryUsername(username?: string | null) {
	return Boolean(username?.startsWith("temp_"))
}

function isFirstUsernameSetup(user: { username?: string | null; usernameUpdatedAt?: Date | null; createdAt?: Date | null; usernameIsTemporary?: boolean | null }) {
	if (user.usernameIsTemporary || isTemporaryUsername(user.username)) {
		return true
	}

	if (!user.usernameUpdatedAt || !user.createdAt) {
		return false
	}

	const createdAt = new Date(user.createdAt).getTime()
	const usernameUpdatedAt = new Date(user.usernameUpdatedAt).getTime()
	return Math.abs(usernameUpdatedAt - createdAt) < 10 * 60 * 1000
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
		candidate = `${normalizedBase.slice(0, Math.max(3, maxBaseLength))}_${suffix}`
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
	authProvider?: string | null
}) {
	const lookup = buildUserLookup(sessionUser)
	const existing = await UserModel.findOne(lookup).lean()
	if (existing) {
		if (!existing.usernameIsTemporary && isFirstUsernameSetup(existing)) {
			await UserModel.findByIdAndUpdate(existing._id, {
				$set: { usernameIsTemporary: true },
			})
			return { ...existing, usernameIsTemporary: true }
		}

		return existing
	}

	if (!sessionUser.email) {
		return null
	}

	const baseFromEmail = sessionUser.email.split("@")[0] || "cineaiuser"
	const preferredBase = sessionUser.username || baseFromEmail
	const username = await getUniqueUsername(`temp_${preferredBase}`)

	const created = await UserModel.create({
		name: sessionUser.name || "Movie Lover",
		email: sessionUser.email.toLowerCase(),
		username,
		image: sessionUser.image || null,
		emailVerified: Boolean(sessionUser.emailVerified),
		authProvider: sessionUser.authProvider || "email",
		isPublic: true,
		usernameIsTemporary: true,
		usernameUpdatedAt: new Date(),
		createdAt: new Date(),
		updatedAt: new Date(),
	})

	return created.toObject()
}

export const userRouter = router({
	checkUsernameAvailable: publicProcedure
		.input(
			z.object({
				username: z.string().trim().min(1),
			}),
		)
		.query(async ({ input }) => {
			await connectDB()

			const username = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(username)) {
				return {
					available: false,
					message: "Only letters, numbers, and underscores (3-20 chars)",
				}
			}

			const existingUser = await UserModel.findOne({ username }).select("_id").lean()
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
			await connectDB()

			const username = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(username)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
				})
			}

			const userId = ctx.session.user.id
			const currentUser = await getOrCreateAppUser(ctx.session.user)
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

			const existingUser = await UserModel.findOne({
				username,
				_id: { $ne: currentUser._id },
			}).lean()

			if (existingUser) {
				throw new TRPCError({ code: "CONFLICT", message: "Username is already taken" })
			}

			await UserModel.findByIdAndUpdate(
				currentUser._id,
				{
					$set: {
						username,
						usernameIsTemporary: false,
						usernameUpdatedAt: hasChanged || isFirstSetup ? new Date() : currentUser.usernameUpdatedAt,
						updatedAt: new Date(),
					},
				},
				{ returnDocument: "after" },
			).lean()

			return { success: true }
		}),

	getWatchlist: protectedProcedure.query(async ({ ctx }) => {
		await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const userId = String(currentUser._id)
		const activityUserId = String(currentUser._id)
		const watchlist = await WatchlistModel.find({ userId }).sort({ addedAt: -1 }).lean()

		return watchlist
	}),

	addToWatchlist: protectedProcedure.input(watchlistInput).mutation(async ({ ctx, input }) => {
		await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const userId = String(currentUser._id)
		const activityUserId = String(currentUser._id)

		const watchlistItem = await WatchlistModel.findOneAndUpdate(
			{ userId, movieId: input.movieId },
			{
				$set: {
					title: input.title,
					poster: input.poster,
					overview: input.overview,
					voteAverage: input.voteAverage,
					releaseDate: input.releaseDate,
				},
				$setOnInsert: {
					userId,
					movieId: input.movieId,
					addedAt: new Date(),
				},
			},
			{ upsert: true, returnDocument: "after" },
		).lean()

		await logActivity({
			userId: activityUserId,
			type: "added_watchlist",
			movieId: input.movieId,
			movieTitle: input.title,
			moviePoster: input.poster,
		})

		return watchlistItem
	}),

	removeFromWatchlist: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await connectDB()

			const currentUser = await getOrCreateAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const userId = ctx.session.user.id
			const activityUserId = String(currentUser._id)
			const existing = await WatchlistModel.findOne({ userId, movieId: input.movieId }).lean()
			const result = await WatchlistModel.deleteOne({ userId, movieId: input.movieId })

			if (result.deletedCount === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Watchlist item not found" })
			}

			await logActivity({
				userId: activityUserId,
				type: "removed_watchlist",
				movieId: input.movieId,
				movieTitle: existing?.title,
				moviePoster: existing?.poster,
			})

			return { success: true }
		}),

	getRatings: protectedProcedure.query(async ({ ctx }) => {
		await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const userId = String(currentUser._id)
		return RatingModel.find({ userId }).sort({ updatedAt: -1, createdAt: -1 }).lean()
	}),

	rateMovie: protectedProcedure.input(ratingInput).mutation(async ({ ctx, input }) => {
		await connectDB()

		const currentUser = await getOrCreateAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const userId = String(currentUser._id)
		const activityUserId = String(currentUser._id)

		const rating = await RatingModel.findOneAndUpdate(
			{ userId, movieId: input.movieId },
			{
				$set: {
					title: input.title,
					poster: input.poster,
					rating: input.rating,
					review: input.review,
					updatedAt: new Date(),
				},
				$setOnInsert: {
					userId,
					movieId: input.movieId,
					createdAt: new Date(),
				},
			},
			{ upsert: true, returnDocument: "after" },
		).lean()

		await logActivity({
			userId: activityUserId,
			type: "rated_movie",
			movieId: input.movieId,
			movieTitle: input.title,
			moviePoster: input.poster,
			rating: input.rating,
		})

		return rating
	}),

	resetRating: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			await connectDB()

			const currentUser = await getOrCreateAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const userId = String(currentUser._id)
			const result = await RatingModel.deleteOne({ userId, movieId: input.movieId })

			if (result.deletedCount === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Rating not found" })
			}

			return { success: true }
		}),

	getProfile: protectedProcedure.query(async ({ ctx }) => {
		await connectDB()

		const bootstrapUser = await getOrCreateAppUser(ctx.session.user)
		if (!bootstrapUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const user = await UserModel.findById(bootstrapUser._id)
			.select("name username image imagePublicId bio isPublic email avatarUpdatedAt")
			.lean()

		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		return user
	}),

	updateProfile: protectedProcedure.input(updateProfileInput).mutation(async ({ ctx, input }) => {
		await connectDB()

		const user = await getOrCreateAppUser(ctx.session.user)
		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		const updates: { name?: string; bio?: string; username?: string; isPublic?: boolean; usernameUpdatedAt?: Date; usernameIsTemporary?: boolean } = {}

		if (typeof input.name !== "undefined") {
			updates.name = input.name
		}

		if (typeof input.bio !== "undefined") {
			updates.bio = input.bio
		}

		if (typeof input.isPublic !== "undefined") {
			updates.isPublic = input.isPublic
		}

		if (typeof input.username !== "undefined") {
			const normalizedUsername = input.username.trim().toLowerCase()

			if (!USERNAME_REGEX.test(normalizedUsername)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Username must be 3-20 characters and only contain letters, numbers, and underscores",
				})
			}

			if (normalizedUsername !== user.username) {
				if (!isFirstUsernameSetup(user) && !canChangeUsername(user.usernameUpdatedAt)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Username can only be changed once every 30 days",
					})
				}

				const existingUser = await UserModel.findOne({
					username: normalizedUsername,
					_id: { $ne: user._id },
				}).lean()

				if (existingUser) {
					throw new TRPCError({ code: "CONFLICT", message: "Username is already taken" })
				}

				updates.usernameUpdatedAt = new Date()
			}

			updates.username = normalizedUsername
			updates.usernameIsTemporary = false
		}

		const updatedUser = await UserModel.findByIdAndUpdate(
			user._id,
			{
				$set: {
					...updates,
					updatedAt: new Date(),
				},
			},
			{ returnDocument: "after" },
		).lean()

		if (!updatedUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		return updatedUser
	}),

	deleteAvatar: protectedProcedure.mutation(async ({ ctx }) => {
		await connectDB()

		const user = await getOrCreateAppUser(ctx.session.user)

		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}

		if (user.imagePublicId) {
			await cloudinary.uploader.destroy(user.imagePublicId)
		}

		await UserModel.findByIdAndUpdate(user._id, {
			$set: {
				image: null,
				imagePublicId: null,
				updatedAt: new Date(),
			},
		})

		return { success: true }
	}),
})
