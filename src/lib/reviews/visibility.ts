import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { friendships } from "@/lib/db/schema"

type AuthorLike = {
	id: string
	isPublic?: boolean | null
}

/** Owner, friends, or public profiles can have their reviews viewed/engaged. */
export async function canViewAuthorReviews(
	viewerId: string,
	author: AuthorLike,
): Promise<boolean> {
	if (viewerId === author.id) return true
	if (author.isPublic !== false) return true

	const friendship = await db.query.friendships.findFirst({
		where: and(eq(friendships.userId, viewerId), eq(friendships.friendId, author.id)),
		columns: { id: true },
	})

	return Boolean(friendship)
}

export async function getFriendIds(userId: string): Promise<string[]> {
	const rows = await db
		.select({ friendId: friendships.friendId })
		.from(friendships)
		.where(eq(friendships.userId, userId))

	return rows.map((row) => row.friendId)
}

/** SQL-friendly: author visible if public, self, or in friend set. */
export function isAuthorVisibleToViewer(
	authorId: string,
	authorIsPublic: boolean | null | undefined,
	viewerId: string,
	friendIds: Set<string>,
): boolean {
	if (authorId === viewerId) return true
	if (authorIsPublic !== false) return true
	return friendIds.has(authorId)
}
