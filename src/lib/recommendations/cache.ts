import { redis } from "@/lib/db/redis"

export async function invalidateRecommendationCache(userId: string) {
	const pattern = `recommendations:${userId}:*`
	let cursor = "0"

	do {
		const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100)
		cursor = nextCursor
		if (keys.length > 0) {
			await redis.del(...keys)
		}
	} while (cursor !== "0")
}
