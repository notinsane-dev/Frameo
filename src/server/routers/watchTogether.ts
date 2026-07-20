import { TRPCError } from "@trpc/server"
import { and, cosineDistance, eq, inArray, isNotNull, notInArray, or, sql } from "drizzle-orm"
import { z } from "zod"

import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"
import {
	friendships,
	movies,
	ratings,
	watchTogetherMembers,
	watchTogetherSessions,
	watchTogetherVetoes,
	watchlists,
} from "@/lib/db/schema"
import { ensureAppUser } from "@/lib/db/users"
import { getOrCreateUserEmbedding } from "@/lib/embeddings/users"
import { embedText, generateContent } from "@/lib/gemini/client"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBMovieDetail } from "@/lib/tmdb/types"
import {
	blendEmbeddings,
	rankByMoodAndTaste,
	resolveMoodTargets,
} from "@/lib/watch-together/moodMatch"
import { protectedProcedure, router } from "@/server/trpc"

type ShortlistItem = {
	tmdbId: number
	title: string
	posterPath: string | null
	reason: string
	score: number
}

function sessionCode() {
	return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function averageEmbeddings(vectors: number[][]) {
	if (vectors.length === 0) return null
	const dims = vectors[0].length
	const out = new Array(dims).fill(0)
	for (const vector of vectors) {
		for (let i = 0; i < dims; i += 1) out[i] += vector[i]
	}
	for (let i = 0; i < dims; i += 1) out[i] /= vectors.length
	let norm = 0
	for (const value of out) norm += value * value
	norm = Math.sqrt(norm)
	if (norm > 0) {
		for (let i = 0; i < dims; i += 1) out[i] /= norm
	}
	return out as number[]
}

function parseShortlist(raw: string | null): ShortlistItem[] {
	if (!raw) return []
	try {
		const parsed = JSON.parse(raw) as ShortlistItem[]
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

async function assertMember(sessionId: number, userId: string) {
	const [member] = await db
		.select()
		.from(watchTogetherMembers)
		.where(
			and(eq(watchTogetherMembers.sessionId, sessionId), eq(watchTogetherMembers.userId, userId)),
		)
		.limit(1)
	if (!member) {
		throw new TRPCError({ code: "FORBIDDEN", message: "You are not in this session" })
	}
	return member
}

async function getSessionById(sessionId: number) {
	const [session] = await db
		.select()
		.from(watchTogetherSessions)
		.where(eq(watchTogetherSessions.id, sessionId))
		.limit(1)
	return session ?? null
}

async function getSessionByCode(code: string) {
	const [session] = await db
		.select()
		.from(watchTogetherSessions)
		.where(eq(watchTogetherSessions.code, code))
		.limit(1)
	return session ?? null
}

export const watchTogetherRouter = router({
	create: protectedProcedure
		.input(
			z
				.object({
					mood: z.string().trim().optional(),
					friendIds: z.array(z.string()).max(8).default([]),
				})
				.optional(),
		)
		.mutation(async ({ ctx, input }) => {
			const host = await ensureAppUser(ctx.session.user)
			if (!host) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const friendIds = input?.friendIds ?? []
			if (friendIds.length > 0) {
				const confirmed = await db
					.select({ friendId: friendships.friendId })
					.from(friendships)
					.where(
						and(eq(friendships.userId, host.id), inArray(friendships.friendId, friendIds)),
					)
				if (confirmed.length !== friendIds.length) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "You can only invite confirmed friends",
					})
				}
			}

			const code = sessionCode()
			const now = new Date()
			const [session] = await db
				.insert(watchTogetherSessions)
				.values({
					hostId: host.id,
					code,
					mood: input?.mood || "any",
					status: "open",
					createdAt: now,
					updatedAt: now,
				})
				.returning()

			const hostMood = input?.mood?.trim() || null
			const memberIds = Array.from(new Set([host.id, ...friendIds]))
			await db.insert(watchTogetherMembers).values(
				memberIds.map((userId) => ({
					sessionId: session.id,
					userId,
					mood: userId === host.id ? hostMood : null,
					vetoesRemaining: 1,
				})),
			)

			return { sessionId: session.id, code: session.code }
		}),

	join: protectedProcedure
		.input(z.object({ code: z.string().trim().min(4).max(12) }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const session = await getSessionByCode(input.code.trim().toUpperCase())
			if (!session || session.status === "closed") {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
			}

			await db
				.insert(watchTogetherMembers)
				.values({
					sessionId: session.id,
					userId: currentUser.id,
					mood: null,
					vetoesRemaining: 1,
				})
				.onConflictDoNothing()

			return { sessionId: session.id, code: session.code }
		}),

	setMood: protectedProcedure
		.input(
			z.object({
				sessionId: z.number().int().positive(),
				mood: z.string().trim().min(1).max(40),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const session = await getSessionById(input.sessionId)
			if (!session || session.status === "closed") {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Session is not open" })
			}

			const member = await assertMember(input.sessionId, currentUser.id)
			const mood = input.mood.trim().replace(/\s+/g, " ")

			await db
				.update(watchTogetherMembers)
				.set({ mood })
				.where(eq(watchTogetherMembers.id, member.id))

			const memberMoods = await db
				.select({ mood: watchTogetherMembers.mood })
				.from(watchTogetherMembers)
				.where(eq(watchTogetherMembers.sessionId, input.sessionId))

			const blended = Array.from(
				new Set(
					memberMoods
						.map((row) => row.mood?.trim())
						.filter((value): value is string => Boolean(value)),
				),
			).join(" · ")

			await db
				.update(watchTogetherSessions)
				.set({
					mood: blended || mood,
					updatedAt: new Date(),
				})
				.where(eq(watchTogetherSessions.id, session.id))

			return { mood }
		}),

	get: protectedProcedure
		.input(z.object({ sessionId: z.number().int().positive() }))
		.query(async ({ ctx, input }) => {
			try {
				const currentUser = await ensureAppUser(ctx.session.user)
				if (!currentUser) {
					throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
				}

				const [member] = await db
					.select({
						id: watchTogetherMembers.id,
						vetoesRemaining: watchTogetherMembers.vetoesRemaining,
					})
					.from(watchTogetherMembers)
					.where(
						and(
							eq(watchTogetherMembers.sessionId, input.sessionId),
							eq(watchTogetherMembers.userId, currentUser.id),
						),
					)
					.limit(1)

				if (!member) {
					throw new TRPCError({ code: "FORBIDDEN", message: "You are not in this session" })
				}

				const session = await getSessionById(input.sessionId)
				if (!session) {
					throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
				}

				const members = await db
					.select({
						userId: watchTogetherMembers.userId,
						mood: watchTogetherMembers.mood,
						vetoesRemaining: watchTogetherMembers.vetoesRemaining,
						name: user.name,
						username: user.username,
						image: user.image,
					})
					.from(watchTogetherMembers)
					.innerJoin(user, eq(user.id, watchTogetherMembers.userId))
					.where(eq(watchTogetherMembers.sessionId, input.sessionId))

				const vetoes = await db
					.select({
						userId: watchTogetherVetoes.userId,
						movieId: watchTogetherVetoes.movieId,
					})
					.from(watchTogetherVetoes)
					.where(eq(watchTogetherVetoes.sessionId, input.sessionId))

				const vetoedIds = new Set(vetoes.map((veto) => veto.movieId))
				const shortlist = parseShortlist(session.shortlist).filter(
					(item) => !vetoedIds.has(item.tmdbId),
				)

				const myMood =
					members.find((row) => row.userId === currentUser.id)?.mood ?? null
				const pendingMoods = members.filter((row) => !row.mood).map((row) => row.name)

				return {
					id: session.id,
					code: session.code,
					hostId: session.hostId,
					mood: session.mood,
					status: session.status,
					members,
					shortlist,
					vetoes,
					isHost: session.hostId === currentUser.id,
					myMood,
					pendingMoods,
				}
			} catch (error) {
				if (error instanceof TRPCError) throw error
				console.error("[watchTogether.get] failed", error)
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: error instanceof Error ? error.message : "Failed to load session",
					cause: error,
				})
			}
		}),

	generateShortlist: protectedProcedure
		.input(
			z.object({
				sessionId: z.number().int().positive(),
				limit: z.number().int().min(3).max(10).default(5),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const session = await getSessionById(input.sessionId)
			if (!session) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
			}
			if (session.status === "closed") {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Session is closed" })
			}
			if (session.hostId !== currentUser.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can generate picks" })
			}

			const members = await db
				.select({
					userId: watchTogetherMembers.userId,
					mood: watchTogetherMembers.mood,
					name: user.name,
				})
				.from(watchTogetherMembers)
				.innerJoin(user, eq(user.id, watchTogetherMembers.userId))
				.where(eq(watchTogetherMembers.sessionId, input.sessionId))

			const missingMood = members.filter((member) => !member.mood?.trim())
			if (missingMood.length > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Wait for moods from: ${missingMood.map((m) => m.name).join(", ")}`,
				})
			}

			const memberIds = members.map((member) => member.userId)
			const memberMoods = members.map((member) => member.mood!)
			const moodTargets = resolveMoodTargets(memberMoods)

			const embeddings = (
				await Promise.all(memberIds.map((id) => getOrCreateUserEmbedding(id)))
			).filter((value): value is number[] => Array.isArray(value))

			const groupEmbedding = averageEmbeddings(embeddings)
			if (!groupEmbedding) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Members need ratings/watch history before we can pick",
				})
			}

			let searchEmbedding = groupEmbedding
			try {
				const moodEmbedding = await embedText(moodTargets.queryText, "RETRIEVAL_QUERY")
				// Mood should dominate — otherwise picks ignore "horror / thrill" etc.
				searchEmbedding = blendEmbeddings(groupEmbedding, moodEmbedding, 0.7)
			} catch (error) {
				console.error("[watchTogether.generateShortlist] mood embed failed", error)
			}

			const excludedRows = await db
				.select({ movieId: ratings.movieId })
				.from(ratings)
				.where(inArray(ratings.userId, memberIds))
			const excluded = Array.from(new Set(excludedRows.map((row) => row.movieId)))

			const distance = cosineDistance(movies.embedding, searchEmbedding)
			const conditions = [isNotNull(movies.embedding)]
			if (excluded.length > 0) {
				conditions.push(notInArray(movies.tmdbId, excluded))
			}

			// Soft genre preference: when we know mood genres, prefer those rows first
			if (moodTargets.genres.length > 0) {
				const genreMatch = or(
					...moodTargets.genres.map(
						(genre) => sql`${genre} = any(${movies.genres})`,
					),
				)
				if (genreMatch) {
					conditions.push(genreMatch)
				}
			}

			let pool = await db
				.select({
					tmdbId: movies.tmdbId,
					title: movies.title,
					posterPath: movies.posterPath,
					genres: movies.genres,
					overview: movies.overview,
					distance,
				})
				.from(movies)
				.where(and(...conditions))
				.orderBy(distance)
				.limit(Math.max(input.limit * 10, 40))

			// If genre filter was too tight, fall back to mood-blended pool without hard filter
			if (pool.length < input.limit && moodTargets.genres.length > 0) {
				const looseConditions = [isNotNull(movies.embedding)]
				if (excluded.length > 0) {
					looseConditions.push(notInArray(movies.tmdbId, excluded))
				}
				pool = await db
					.select({
						tmdbId: movies.tmdbId,
						title: movies.title,
						posterPath: movies.posterPath,
						genres: movies.genres,
						overview: movies.overview,
						distance,
					})
					.from(movies)
					.where(and(...looseConditions))
					.orderBy(distance)
					.limit(Math.max(input.limit * 10, 40))
			}

			if (pool.length === 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"No movies match this mood yet. Try a broader mood, or seed more film embeddings.",
				})
			}

			const ranked = rankByMoodAndTaste(
				pool.map((row) => ({ ...row, distance: Number(row.distance) })),
				moodTargets,
			)
			const shortlistPool = ranked.slice(0, Math.max(input.limit * 3, 12))

			const watchlistRows = await db
				.select({
					movieId: watchlists.movieId,
					title: watchlists.title,
					userId: watchlists.userId,
				})
				.from(watchlists)
				.where(inArray(watchlists.userId, memberIds))

			const sharedWatchlist = watchlistRows.reduce<
				Map<number, { title: string; count: number }>
			>((map, row) => {
				const existing = map.get(row.movieId)
				if (existing) existing.count += 1
				else map.set(row.movieId, { title: row.title, count: 1 })
				return map
			}, new Map())

			const sharedTitles = Array.from(sharedWatchlist.entries())
				.filter(([, value]) => value.count >= 2)
				.map(([, value]) => value.title)

			const moodBreakdown = members
				.map((member) => `${member.name}: ${member.mood}`)
				.join("; ")
			const candidateBlock = shortlistPool
				.map(
					({ row, genreScore }) =>
						`${row.tmdbId}:${row.title} [genres=${(row.genres ?? []).join("|") || "none"}; moodFit=${genreScore.toFixed(2)}]`,
				)
				.join("; ")

			const byId = new Map(shortlistPool.map((entry) => [entry.row.tmdbId, entry]))

			let orderedIds: number[] = shortlistPool
				.slice(0, input.limit)
				.map((entry) => entry.row.tmdbId)
			const reasons: Record<number, string> = {}

			try {
				const prompt = `You are picking movies for a group watch night.

Required mood: ${moodTargets.labels.join(", ")}
Target genres: ${moodTargets.genres.join(", ") || "any"}
Individual moods: ${moodBreakdown}
Shared watchlist overlap: ${sharedTitles.join(", ") || "none"}

Candidates (already mood-ranked). ONLY choose from these tmdbIds:
${candidateBlock}

Return a JSON array of exactly ${input.limit} objects: { "tmdbId": number, "reason": string }.
Rules:
- Every pick MUST fit the mood (${moodTargets.labels.join(", ")}). Reject anything that doesn't match.
- Prefer higher moodFit and matching genres.
- Reasons must mention how the film fits the mood (1 short sentence).
- Do not invent tmdbIds.`

				const raw = await generateContent(prompt)
				const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim()
				const start = cleaned.indexOf("[")
				const end = cleaned.lastIndexOf("]")
				const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Array<{
					tmdbId: number
					reason: string
				}>

				const geminiIds = parsed
					.map((item) => Number(item?.tmdbId))
					.filter((id) => byId.has(id))

				const uniqueGeminiIds = Array.from(new Set(geminiIds))
				if (uniqueGeminiIds.length > 0) {
					orderedIds = [
						...uniqueGeminiIds,
						...orderedIds.filter((id) => !uniqueGeminiIds.includes(id)),
					].slice(0, input.limit)
				}

				for (const item of parsed) {
					const id = Number(item?.tmdbId)
					if (byId.has(id) && item?.reason) {
						reasons[id] = item.reason
					}
				}
			} catch (error) {
				console.error("[watchTogether.generateShortlist] gemini select failed", error)
			}

			const shortlist: ShortlistItem[] = orderedIds.map((tmdbId, index) => {
				const entry = byId.get(tmdbId)!
				const { row, score, genreScore } = entry
				const genreHint =
					moodTargets.genres.length > 0
						? ` Matches ${moodTargets.labels.join(" / ")}.`
						: ""

				return {
					tmdbId: row.tmdbId,
					title: row.title,
					posterPath: row.posterPath,
					reason:
						reasons[tmdbId] ||
						`Strong mood + group-taste match.${genreHint}${
							sharedTitles.length ? " Overlapping watchlists help." : ""
						}`,
					score: Math.max(
						0.5,
						Math.min(0.98, score * 0.85 + genreScore * 0.1 - index * 0.02),
					),
				}
			})

			await db
				.update(watchTogetherSessions)
				.set({
					shortlist: JSON.stringify(shortlist),
					mood: moodTargets.labels.join(", "),
					status: "voting",
					updatedAt: new Date(),
				})
				.where(eq(watchTogetherSessions.id, session.id))

			return { shortlist }
		}),

	veto: protectedProcedure
		.input(
			z.object({
				sessionId: z.number().int().positive(),
				movieId: z.number().int().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const member = await assertMember(input.sessionId, currentUser.id)
			if (member.vetoesRemaining <= 0) {
				throw new TRPCError({ code: "BAD_REQUEST", message: "No vetoes remaining" })
			}

			const session = await getSessionById(input.sessionId)
			if (!session || session.status === "closed") {
				throw new TRPCError({ code: "BAD_REQUEST", message: "Session is closed" })
			}

			await db.transaction(async (tx) => {
				await tx.insert(watchTogetherVetoes).values({
					sessionId: input.sessionId,
					userId: currentUser.id,
					movieId: input.movieId,
				})
				await tx
					.update(watchTogetherMembers)
					.set({ vetoesRemaining: member.vetoesRemaining - 1 })
					.where(eq(watchTogetherMembers.id, member.id))
			})

			return { success: true }
		}),

	close: protectedProcedure
		.input(z.object({ sessionId: z.number().int().positive() }))
		.mutation(async ({ ctx, input }) => {
			const currentUser = await ensureAppUser(ctx.session.user)
			if (!currentUser) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" })
			}

			const session = await getSessionById(input.sessionId)
			if (!session) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
			}
			if (session.hostId !== currentUser.id) {
				throw new TRPCError({ code: "FORBIDDEN", message: "Only the host can close the session" })
			}

			await db
				.update(watchTogetherSessions)
				.set({ status: "closed", updatedAt: new Date() })
				.where(eq(watchTogetherSessions.id, session.id))

			return { success: true }
		}),

	hydrateMovie: protectedProcedure
		.input(z.object({ movieId: z.number().int().positive() }))
		.query(async ({ input }) => {
			const detail = await tmdb.getMovieById(input.movieId)
			return detail as TMDBMovieDetail
		}),
})
