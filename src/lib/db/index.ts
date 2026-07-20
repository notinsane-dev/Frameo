import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as authSchema from "@/lib/db/auth-schema"
import * as appSchema from "@/lib/db/schema"

const schema = { ...authSchema, ...appSchema }

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
	throw new Error("Missing DATABASE_URL in environment variables")
}

const schemaFingerprint = Object.keys(schema).sort().join(",")

const globalForDb = globalThis as typeof globalThis & {
	pgClient?: ReturnType<typeof postgres>
	drizzleDb?: ReturnType<typeof drizzle<typeof schema>>
	drizzleSchemaFingerprint?: string
}

const client =
	globalForDb.pgClient ??
	postgres(DATABASE_URL, {
		// Required for Supabase transaction pooler (:6543)
		prepare: false,
		// Keep serverless pool small; rely on Supabase pooler for fan-out
		max: 3,
		idle_timeout: 20,
		max_lifetime: 60 * 30,
		connect_timeout: 10,
	})

// Recreate Drizzle when schema exports change (dev hot-reload can otherwise
// keep a stale db.query map while table refs from imports stay current).
const db =
	globalForDb.drizzleDb && globalForDb.drizzleSchemaFingerprint === schemaFingerprint
		? globalForDb.drizzleDb
		: drizzle(client, { schema })

globalForDb.pgClient = client
globalForDb.drizzleDb = db
globalForDb.drizzleSchemaFingerprint = schemaFingerprint

export { db }

export type Database = typeof db
