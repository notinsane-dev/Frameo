import { and, eq, ilike, inArray, ne, or } from "drizzle-orm"

import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"

export type AppUser = typeof user.$inferSelect

export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

function toUsernameBase(input: string) {
	const normalized = input
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "")
		.slice(0, 20)

	if (normalized.length >= 3) return normalized
	return "cineaiuser"
}

export function isTemporaryUsername(username?: string | null) {
	return Boolean(username?.startsWith("temp_"))
}

export function isFirstUsernameSetup(profile: {
	username?: string | null
	usernameUpdatedAt?: Date | null
	createdAt?: Date | null
	usernameIsTemporary?: boolean | null
}) {
	if (profile.usernameIsTemporary || isTemporaryUsername(profile.username)) {
		return true
	}

	if (!profile.usernameUpdatedAt || !profile.createdAt) {
		return false
	}

	const createdAt = new Date(profile.createdAt).getTime()
	const usernameUpdatedAt = new Date(profile.usernameUpdatedAt).getTime()
	return Math.abs(usernameUpdatedAt - createdAt) < 10 * 60 * 1000
}

export async function getUniqueUsername(base: string) {
	const normalizedBase = toUsernameBase(base)

	let candidate = normalizedBase
	let counter = 1

	while (counter <= 50) {
		const existing = await db.query.user.findFirst({
			where: eq(user.username, candidate),
			columns: { id: true },
		})
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

/**
 * Ensures the Better Auth user row has profile fields filled in
 * (temporary username, defaults). Collapses the old dual-store sync.
 */
export async function ensureAppUser(sessionUser: {
	id: string
	email?: string | null
	name?: string | null
	image?: string | null
	username?: string | null
	emailVerified?: boolean | null
	authProvider?: string | null
}): Promise<AppUser | null> {
	const existing = await db.query.user.findFirst({
		where: eq(user.id, sessionUser.id),
	})

	if (!existing) {
		return null
	}

	if (!existing.username || existing.username.trim().length === 0) {
		const baseFromEmail = sessionUser.email?.split("@")[0] || "cineaiuser"
		const preferredBase = sessionUser.username || baseFromEmail
		const username = await getUniqueUsername(`temp_${preferredBase}`)
		const now = new Date()

		const [updated] = await db
			.update(user)
			.set({
				username,
				displayUsername: username,
				usernameIsTemporary: true,
				usernameUpdatedAt: now,
				authProvider: existing.authProvider || sessionUser.authProvider || "email",
				updatedAt: now,
			})
			.where(eq(user.id, existing.id))
			.returning()

		return updated ?? existing
	}

	if (isFirstUsernameSetup(existing) && !existing.usernameIsTemporary) {
		const [updated] = await db
			.update(user)
			.set({ usernameIsTemporary: true, updatedAt: new Date() })
			.where(eq(user.id, existing.id))
			.returning()
		return updated ?? { ...existing, usernameIsTemporary: true }
	}

	return existing
}

export async function findUserById(userId: string) {
	return db.query.user.findFirst({
		where: eq(user.id, userId),
	})
}

export async function findUserByUsername(username: string) {
	const normalized = username.trim().toLowerCase()
	if (!normalized) return null

	return db.query.user.findFirst({
		where: eq(user.username, normalized),
	})
}

export async function findUsersByIds(userIds: string[]) {
	const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
	if (uniqueIds.length === 0) {
		return new Map<string, AppUser>()
	}

	const users = await db.query.user.findMany({
		where: inArray(user.id, uniqueIds),
	})

	const map = new Map<string, AppUser>()
	for (const row of users) {
		map.set(row.id, row)
	}
	return map
}

export async function searchUsers(query: string, excludeUserId: string, limit = 10) {
	const pattern = `%${query}%`
	return db
		.select({
			id: user.id,
			name: user.name,
			image: user.image,
			username: user.username,
		})
		.from(user)
		.where(
			and(
				ne(user.id, excludeUserId),
				or(ilike(user.name, pattern), ilike(user.username, pattern)),
			),
		)
		.limit(limit)
}

export { eq, ne, user }
