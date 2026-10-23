import Redis from "ioredis"

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

const globalWithRedis = globalThis as typeof globalThis & {
	redisClient?: Redis
}

export const redis =
	globalWithRedis.redisClient ??
	new Redis(REDIS_URL, {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		lazyConnect: true,
	})

if (!globalWithRedis.redisClient) {
	redis.on("error", (err) => {
		if (process.env.NODE_ENV === "development") {
			console.warn("[Redis] Connection warning:", err.message)
		}
	})
}

globalWithRedis.redisClient = redis
