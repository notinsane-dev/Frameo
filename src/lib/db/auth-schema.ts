import { sql } from "drizzle-orm"
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	username: text("username").unique(),
	displayUsername: text("display_username"),
	bio: text("bio"),
	authProvider: text("auth_provider").default("email"),
	isPublic: boolean("is_public").notNull().default(true),
	imagePublicId: text("image_public_id"),
	avatarUpdatedAt: timestamp("avatar_updated_at"),
	usernameIsTemporary: boolean("username_is_temporary").notNull().default(false),
	usernameUpdatedAt: timestamp("username_updated_at"),
	favoriteGenres: text("favorite_genres")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	/** TMDB watch provider IDs the user subscribes to (e.g. "8" = Netflix) */
	streamingServices: text("streaming_services")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	/** Soft-negative taste tags the user asked to hide */
	hiddenVibes: text("hidden_vibes")
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
})

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at").notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
)

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at"),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		unique("account_provider_account_uidx").on(table.providerId, table.accountId),
	],
)

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
)
