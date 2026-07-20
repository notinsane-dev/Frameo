import { TRPCError } from "@trpc/server"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { logActivity } from "@/lib/activity"
import { db } from "@/lib/db"
import { watchedLogs } from "@/lib/db/schema"
import { ensureAppUser } from "@/lib/db/users"
import { ensureMovieEmbeddedFromMetadata } from "@/lib/embeddings/movies"
import { refreshUserTaste } from "@/lib/embeddings/users"
import { generateContent } from "@/lib/gemini/client"
import { invalidateRecommendationCache } from "@/lib/recommendations/cache"
import { protectedProcedure, router } from "@/server/trpc"

async function generateCapsuleReview(title: string, overview?: string | null) {
	try {
		const raw = await generateContent(
			`Write one short casual capsule review (max 140 characters) for the movie "${title}". Overview: ${overview || "n/a"}. No spoilers. Return plain text only.`,
		)
		return raw.replace(/["\n]/g, " ").trim().slice(0, 160)
	} catch {
		return `Logged ${title} — adding it to your taste profile.`
	}
}

export const diaryRouter = router({
	list: protectedProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).default(30),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			return db
				.select()
				.from(watchedLogs)
				.where(eq(watchedLogs.userId, currentUser.id))
				.orderBy(desc(watchedLogs.watchedAt))
				.limit(input?.limit ?? 30)
		}),

	logWatched: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
				title: z.string().trim().min(1),
				poster: z.string().optional(),
				overview: z.string().optional(),
				watchedAt: z.string().datetime().optional(),
				generateCapsule: z.boolean().default(true),
				capsuleReview: z.string().trim().max(200).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const watchedAt = input.watchedAt ? new Date(input.watchedAt) : new Date()
			const capsule =
				input.capsuleReview ||
				(input.generateCapsule
					? await generateCapsuleReview(input.title, input.overview)
					: null)

			const now = new Date()
			const [row] = await db
				.insert(watchedLogs)
				.values({
					userId: currentUser.id,
					movieId: input.movieId,
					title: input.title,
					poster: input.poster,
					watchedAt,
					capsuleReview: capsule,
					createdAt: now,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [watchedLogs.userId, watchedLogs.movieId],
					set: {
						title: input.title,
						poster: input.poster,
						watchedAt,
						capsuleReview: capsule,
						updatedAt: now,
					},
				})
				.returning()

			await logActivity({
				userId: currentUser.id,
				type: "watched_movie",
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
				.catch((error) => console.error("[diary.logWatched] taste refresh failed", error))

			return row
		}),

	updateCapsule: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
				capsuleReview: z.string().trim().max(200),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const [updated] = await db
				.update(watchedLogs)
				.set({
					capsuleReview: input.capsuleReview,
					updatedAt: new Date(),
				})
				.where(
					and(eq(watchedLogs.userId, currentUser.id), eq(watchedLogs.movieId, input.movieId)),
				)
				.returning()

			if (!updated) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Watch log not found" })
			}

			return updated
		}),

	remove: protectedProcedure
		.input(z.object({ movieId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const deleted = await db
				.delete(watchedLogs)
				.where(
					and(eq(watchedLogs.userId, currentUser.id), eq(watchedLogs.movieId, input.movieId)),
				)
				.returning({ id: watchedLogs.id })

			if (deleted.length === 0) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Watch log not found" })
			}

			await invalidateRecommendationCache(currentUser.id)
			void refreshUserTaste(currentUser.id).catch(() => undefined)

			return { success: true }
		}),
})
