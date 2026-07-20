import Redis from "ioredis"

const REDIS_URL = process.env.REDIS_URL

if (!REDIS_URL) {
	throw new Error("Missing REDIS_URL in environment variables")
}

const globalWithRedis = globalThis as typeof globalThis & {
	redisClient?: Redis
}

export const redis =
	globalWithRedis.redisClient ??
	new Redis(REDIS_URL, {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
		lazyConnect: false,
	})

globalWithRedis.redisClient = redis
