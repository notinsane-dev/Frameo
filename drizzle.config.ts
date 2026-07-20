import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env.local" })
config({ path: ".env" })

/**
 * drizzle-kit push/pull against Supabase's transaction pooler (:6543) or
 * non-public schemas often crashes with:
 *   TypeError: Cannot read properties of undefined (reading 'replace')
 *
 * Prefer a direct/session URL for kit, and only introspect `public`.
 */
function resolveKitDatabaseUrl() {
	const direct = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL_SESSION
	if (direct) return direct

	const url = process.env.DATABASE_URL
	if (!url) {
		throw new Error(
			"Missing DATABASE_URL (or DATABASE_URL_DIRECT) in environment variables (.env.local or .env)",
		)
	}

	// Transaction pooler → session pooler port for drizzle-kit only
	try {
		const parsed = new URL(url)
		if (parsed.port === "6543") {
			parsed.port = "5432"
			return parsed.toString()
		}
	} catch {
		// fall through with original URL
	}

	return url
}

export default defineConfig({
	schema: ["./src/lib/db/auth-schema.ts", "./src/lib/db/schema.ts"],
	out: "./drizzle",
	dialect: "postgresql",
	schemaFilter: ["public"],
	dbCredentials: {
		url: resolveKitDatabaseUrl(),
	},
})
