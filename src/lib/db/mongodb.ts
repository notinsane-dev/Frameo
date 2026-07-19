import { Db, MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables")
}

const resolvedMongoUri: string = MONGODB_URI

type MongoCache = {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

const globalWithMongo = global as typeof globalThis & {
  mongoCache?: MongoCache
}

const cache = globalWithMongo.mongoCache ?? (globalWithMongo.mongoCache = { client: null, promise: null })

async function getMongoClient() {
  if (cache.client) {
    return cache.client
  }

  if (!cache.promise) {
    cache.promise = new MongoClient(resolvedMongoUri).connect()
  }

  cache.client = await cache.promise
  return cache.client
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient()
  return client.db()
}
