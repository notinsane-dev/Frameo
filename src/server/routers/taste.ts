import { TRPCError } from "@trpc/server"
import { and, cosineDistance, desc, eq, ne, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"
import { friendships, ratings, userEmbeddings } from "@/lib/db/schema"
import { ensureAppUser } from "@/lib/db/users"
import { getOrCreateUserEmbedding, refreshUserTaste } from "@/lib/embeddings/users"
import { invalidateRecommendationCache } from "@/lib/recommendations/cache"
import { protectedProcedure, router } from "@/server/trpc"

export const tasteRouter = router({
	getTwins: protectedProcedure
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

			const embedding = await getOrCreateUserEmbedding(currentUser.id)
			if (!embedding) {
				return {
					twins: [],
					message: "Rate or log a few movies so we can find taste twins.",
				}
			}

			const distance = cosineDistance(userEmbeddings.embedding, embedding)
			const twinRows = await db
				.select({
					userId: userEmbeddings.userId,
					distance,
					name: user.name,
					username: user.username,
					image: user.image,
					bio: user.bio,
					isPublic: user.isPublic,
				})
				.from(userEmbeddings)
				.innerJoin(user, eq(user.id, userEmbeddings.userId))
				.where(and(ne(userEmbeddings.userId, currentUser.id), eq(user.isPublic, true)))
				.orderBy(distance)
				.limit(input?.limit ?? 8)

			const myTop = await db
				.select({ movieId: ratings.movieId, title: ratings.title })
				.from(ratings)
				.where(and(eq(ratings.userId, currentUser.id), sql`${ratings.rating} >= 7`))
				.orderBy(desc(ratings.rating))
				.limit(20)

			const myTopIds = new Set(myTop.map((row) => row.movieId))
			const friendRows = await db
				.select({ friendId: friendships.friendId })
				.from(friendships)
				.where(eq(friendships.userId, currentUser.id))
			const friendIds = new Set(friendRows.map((row) => row.friendId))

			const twins = await Promise.all(
				twinRows.map(async (twin) => {
					const theirTop = await db
						.select({ movieId: ratings.movieId, title: ratings.title, rating: ratings.rating })
						.from(ratings)
						.where(and(eq(ratings.userId, twin.userId), sql`${ratings.rating} >= 7`))
						.orderBy(desc(ratings.rating))
						.limit(20)

					const overlap = theirTop.filter((row) => myTopIds.has(row.movieId))
					const disagreement = theirTop
						.filter((row) => !myTopIds.has(row.movieId))
						.slice(0, 3)

					return {
						id: twin.userId,
						name: twin.name,
						username: twin.username,
						image: twin.image,
						bio: twin.bio,
						similarity: Math.max(0, Math.min(1, 1 - Number(twin.distance))),
						isFriend: friendIds.has(twin.userId),
						overlapCount: overlap.length,
						overlapTitles: overlap.slice(0, 5).map((row) => row.title),
						theirPicks: disagreement.map((row) => row.title),
						whyMatch:
							overlap.length > 0
								? `You both love ${overlap
										.slice(0, 2)
										.map((row) => row.title)
										.join(" & ")}`
								: "Close taste vectors — similar pacing and tone preferences.",
					}
				}),
			)

			return {
				twins,
				message:
					twins.length === 0
						? "No taste twins yet. Rate more movies, or check back as more people build profiles."
						: null,
			}
		}),

	hideVibe: protectedProcedure
		.input(
			z.object({
				vibe: z.string().trim().min(2).max(80),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const vibe = input.vibe.trim().toLowerCase()
			const next = Array.from(new Set([...(currentUser.hiddenVibes ?? []), vibe])).slice(0, 40)

			await db
				.update(user)
				.set({ hiddenVibes: next, updatedAt: new Date() })
				.where(eq(user.id, currentUser.id))

			await invalidateRecommendationCache(currentUser.id)
			void refreshUserTaste(currentUser.id).catch(() => undefined)

			return { hiddenVibes: next }
		}),

	unhideVibe: protectedProcedure
		.input(z.object({ vibe: z.string().trim().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const vibe = input.vibe.trim().toLowerCase()
			const next = (currentUser.hiddenVibes ?? []).filter((item) => item !== vibe)

			await db
				.update(user)
				.set({ hiddenVibes: next, updatedAt: new Date() })
				.where(eq(user.id, currentUser.id))

			await invalidateRecommendationCache(currentUser.id)

			return { hiddenVibes: next }
		}),

	getHiddenVibes: protectedProcedure.query(async ({ ctx }) => {
		const currentUser = await ensureAppUser(ctx.session.user)
		if (!currentUser) {
			throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
		}
		return { hiddenVibes: currentUser.hiddenVibes ?? [] }
	}),

	explainRecommendation: protectedProcedure
		.input(
			z.object({
				movieId: z.number().int().positive(),
				title: z.string().trim().min(1),
				reason: z.string().trim().optional(),
				score: z.number().min(0).max(1).optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const liked = await db
				.select({ title: ratings.title, rating: ratings.rating, movieId: ratings.movieId })
				.from(ratings)
				.where(and(eq(ratings.userId, currentUser.id), sql`${ratings.rating} >= 7`))
				.orderBy(desc(ratings.rating))
				.limit(12)

			const similarLiked = liked.slice(0, 4).map((row) => row.title)

			return {
				movieId: input.movieId,
				title: input.title,
				reason: input.reason || "Aligned with your taste embedding and viewing history.",
				score: input.score ?? 0.7,
				similarLiked,
				dimensions: {
					tone: currentUser.hiddenVibes?.length
						? `Avoiding: ${currentUser.hiddenVibes.slice(0, 3).join(", ")}`
						: "Open to a wide tone range",
					confidence: input.score ?? 0.7,
					signals: [
						liked.length > 0 ? `${liked.length} strong ratings on file` : "Building your taste profile",
						similarLiked.length > 0
							? `Nearest liked: ${similarLiked[0]}`
							: "Add ratings to sharpen matches",
					],
				},
				suggestedHideVibes: extractVibeHints(input.reason),
			}
		}),
})

function extractVibeHints(reason?: string) {
	if (!reason) return ["slow burn", "heavy drama", "chaos comedy"]
	const hints: string[] = []
	const lower = reason.toLowerCase()
	if (lower.includes("dark") || lower.includes("gritty")) hints.push("dark / gritty")
	if (lower.includes("comedy") || lower.includes("funny")) hints.push("broad comedy")
	if (lower.includes("slow") || lower.includes("meditative")) hints.push("slow burn")
	if (lower.includes("action") || lower.includes("thriller")) hints.push("high-octane thriller")
	if (hints.length === 0) hints.push("this vibe")
	return hints.slice(0, 3)
}
