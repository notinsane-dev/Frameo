import mongoose from "mongoose"

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null
        promise: Promise<typeof mongoose> | null
      }
    | undefined
}

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables")
}

const globalWithMongoose = global as typeof globalThis & {
  mongooseCache?: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

const cached =
  globalWithMongoose.mongooseCache ??
  (globalWithMongoose.mongooseCache = { conn: null, promise: null })

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
