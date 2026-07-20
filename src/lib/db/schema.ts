import { sql } from "drizzle-orm"
import {
	type AnyPgColumn,
	doublePrecision,
	index,
	integer,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	vector,
} from "drizzle-orm/pg-core"

import { user } from "@/lib/db/auth-schema"

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
	"pending",
	"accepted",
	"rejected",
])

export const activityTypeEnum = pgEnum("activity_type", [
	"rated_movie",
	"added_watchlist",
	"removed_watchlist",
	"became_friends",
	"created_list",
	"sent_request",
	"watched_movie",
	"agreed_review",
	"commented_review",
	"quoted_review",
])

export const watchTogetherStatusEnum = pgEnum("watch_together_status", [
	"open",
	"voting",
	"closed",
])

export const reviewReactionTypeEnum = pgEnum("review_reaction_type", ["agree", "disagree"])

export const notificationTypeEnum = pgEnum("notification_type", [
	"review_agree",
	"review_disagree",
	"review_comment",
	"review_quote",
])

export const ratings = pgTable(
	"ratings",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		movieId: integer("movie_id").notNull(),
		title: text("title").notNull(),
		poster: text("poster"),
		rating: doublePrecision("rating").notNull(),
		review: text("review"),
		quotedRatingId: integer("quoted_rating_id").references((): AnyPgColumn => ratings.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique("ratings_user_movie_uidx").on(table.userId, table.movieId),
		index("ratings_user_id_idx").on(table.userId),
		index("ratings_movie_id_idx").on(table.movieId),
	],
)

export const watchlists = pgTable(
	"watchlists",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		movieId: integer("movie_id").notNull(),
		title: text("title").notNull(),
		poster: text("poster"),
		overview: text("overview"),
		voteAverage: doublePrecision("vote_average"),
		releaseDate: text("release_date"),
		addedAt: timestamp("added_at").notNull().defaultNow(),
	},
	(table) => [
		unique("watchlists_user_movie_uidx").on(table.userId, table.movieId),
		index("watchlists_user_id_idx").on(table.userId),
	],
)

export const friendships = pgTable(
	"friendships",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		friendId: text("friend_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("friendships_user_friend_uidx").on(table.userId, table.friendId),
		index("friendships_user_id_idx").on(table.userId),
		index("friendships_friend_id_idx").on(table.friendId),
	],
)

export const friendRequests = pgTable(
	"friend_requests",
	{
		id: serial("id").primaryKey(),
		senderId: text("sender_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		receiverId: text("receiver_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		senderName: text("sender_name"),
		senderUsername: text("sender_username"),
		senderImage: text("sender_image"),
		receiverName: text("receiver_name"),
		receiverUsername: text("receiver_username"),
		receiverImage: text("receiver_image"),
		status: friendRequestStatusEnum("status").notNull().default("pending"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique("friend_requests_sender_receiver_uidx").on(table.senderId, table.receiverId),
		index("friend_requests_receiver_id_idx").on(table.receiverId),
		index("friend_requests_sender_id_idx").on(table.senderId),
	],
)

export const activities = pgTable(
	"activities",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: activityTypeEnum("type").notNull(),
		movieId: integer("movie_id"),
		movieTitle: text("movie_title"),
		moviePoster: text("movie_poster"),
		rating: doublePrecision("rating"),
		targetUserId: text("target_user_id"),
		targetUserName: text("target_user_name"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("activities_user_created_idx").on(table.userId, table.createdAt),
		index("activities_created_at_idx").on(table.createdAt),
	],
)

export const movies = pgTable(
	"movies",
	{
		tmdbId: integer("tmdb_id").primaryKey(),
		title: text("title").notNull(),
		overview: text("overview"),
		genres: text("genres")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		/** TMDB watch provider IDs available in the user's region (cached) */
		providerIds: text("provider_ids")
			.array()
			.notNull()
			.default(sql`'{}'::text[]`),
		posterPath: text("poster_path"),
		embedding: vector("embedding", { dimensions: 768 }),
		embeddedAt: timestamp("embedded_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [index("movies_title_idx").on(table.title)],
)

export const userEmbeddings = pgTable("user_embeddings", {
	userId: text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	embedding: vector("embedding", { dimensions: 768 }).notNull(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const watchedLogs = pgTable(
	"watched_logs",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		movieId: integer("movie_id").notNull(),
		title: text("title").notNull(),
		poster: text("poster"),
		watchedAt: timestamp("watched_at").notNull().defaultNow(),
		capsuleReview: text("capsule_review"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		unique("watched_logs_user_movie_uidx").on(table.userId, table.movieId),
		index("watched_logs_user_watched_idx").on(table.userId, table.watchedAt),
	],
)

export const watchTogetherSessions = pgTable("watch_together_sessions", {
	id: serial("id").primaryKey(),
	hostId: text("host_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	code: text("code").notNull().unique(),
	mood: text("mood"),
	status: watchTogetherStatusEnum("status").notNull().default("open"),
	shortlist: text("shortlist"), // JSON string of movie picks
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const watchTogetherMembers = pgTable(
	"watch_together_members",
	{
		id: serial("id").primaryKey(),
		sessionId: integer("session_id")
			.notNull()
			.references(() => watchTogetherSessions.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		mood: text("mood"),
		vetoesRemaining: integer("vetoes_remaining").notNull().default(1),
		joinedAt: timestamp("joined_at").notNull().defaultNow(),
	},
	(table) => [
		unique("watch_together_members_session_user_uidx").on(table.sessionId, table.userId),
		index("watch_together_members_session_idx").on(table.sessionId),
	],
)

export const watchTogetherVetoes = pgTable(
	"watch_together_vetoes",
	{
		id: serial("id").primaryKey(),
		sessionId: integer("session_id")
			.notNull()
			.references(() => watchTogetherSessions.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		movieId: integer("movie_id").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("watch_together_vetoes_uidx").on(table.sessionId, table.userId, table.movieId),
	],
)

export const reviewReactions = pgTable(
	"review_reactions",
	{
		id: serial("id").primaryKey(),
		ratingId: integer("rating_id")
			.notNull()
			.references(() => ratings.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: reviewReactionTypeEnum("type").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("review_reactions_rating_user_uidx").on(table.ratingId, table.userId),
		index("review_reactions_rating_id_idx").on(table.ratingId),
		index("review_reactions_created_at_idx").on(table.createdAt),
	],
)

export const reviewComments = pgTable(
	"review_comments",
	{
		id: serial("id").primaryKey(),
		ratingId: integer("rating_id")
			.notNull()
			.references(() => ratings.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		body: text("body").notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
	},
	(table) => [
		index("review_comments_rating_id_idx").on(table.ratingId),
		index("review_comments_created_at_idx").on(table.createdAt),
	],
)

export const commentLikes = pgTable(
	"comment_likes",
	{
		id: serial("id").primaryKey(),
		commentId: integer("comment_id")
			.notNull()
			.references(() => reviewComments.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		unique("comment_likes_comment_user_uidx").on(table.commentId, table.userId),
		index("comment_likes_comment_id_idx").on(table.commentId),
		index("comment_likes_created_at_idx").on(table.createdAt),
	],
)

export const notifications = pgTable(
	"notifications",
	{
		id: serial("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		actorId: text("actor_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: notificationTypeEnum("type").notNull(),
		ratingId: integer("rating_id").references(() => ratings.id, { onDelete: "cascade" }),
		commentId: integer("comment_id").references(() => reviewComments.id, {
			onDelete: "cascade",
		}),
		movieId: integer("movie_id"),
		movieTitle: text("movie_title"),
		readAt: timestamp("read_at"),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [
		index("notifications_user_created_idx").on(table.userId, table.createdAt),
		index("notifications_user_unread_idx").on(table.userId, table.readAt),
	],
)
