-- Review social layer: reactions, comments, likes, notifications, quotes

ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'agreed_review';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'commented_review';
ALTER TYPE "activity_type" ADD VALUE IF NOT EXISTS 'quoted_review';

DO $$ BEGIN
	CREATE TYPE "review_reaction_type" AS ENUM ('agree', 'disagree');
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	CREATE TYPE "notification_type" AS ENUM (
		'review_agree',
		'review_disagree',
		'review_comment',
		'review_quote'
	);
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "ratings" ADD COLUMN IF NOT EXISTS "quoted_rating_id" integer;
CREATE INDEX IF NOT EXISTS "ratings_movie_id_idx" ON "ratings" ("movie_id");

DO $$ BEGIN
	ALTER TABLE "ratings"
		ADD CONSTRAINT "ratings_quoted_rating_id_ratings_id_fk"
		FOREIGN KEY ("quoted_rating_id") REFERENCES "ratings"("id") ON DELETE set null;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "review_reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"type" "review_reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "review_reactions"
		ADD CONSTRAINT "review_reactions_rating_id_ratings_id_fk"
		FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "review_reactions"
		ADD CONSTRAINT "review_reactions_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "review_reactions_rating_user_uidx"
	ON "review_reactions" ("rating_id", "user_id");
CREATE INDEX IF NOT EXISTS "review_reactions_rating_id_idx" ON "review_reactions" ("rating_id");
CREATE INDEX IF NOT EXISTS "review_reactions_created_at_idx" ON "review_reactions" ("created_at");

CREATE TABLE IF NOT EXISTS "review_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"rating_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "review_comments"
		ADD CONSTRAINT "review_comments_rating_id_ratings_id_fk"
		FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "review_comments"
		ADD CONSTRAINT "review_comments_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "review_comments_rating_id_idx" ON "review_comments" ("rating_id");
CREATE INDEX IF NOT EXISTS "review_comments_created_at_idx" ON "review_comments" ("created_at");

CREATE TABLE IF NOT EXISTS "comment_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "comment_likes"
		ADD CONSTRAINT "comment_likes_comment_id_review_comments_id_fk"
		FOREIGN KEY ("comment_id") REFERENCES "review_comments"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "comment_likes"
		ADD CONSTRAINT "comment_likes_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "comment_likes_comment_user_uidx"
	ON "comment_likes" ("comment_id", "user_id");
CREATE INDEX IF NOT EXISTS "comment_likes_comment_id_idx" ON "comment_likes" ("comment_id");
CREATE INDEX IF NOT EXISTS "comment_likes_created_at_idx" ON "comment_likes" ("created_at");

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"rating_id" integer,
	"comment_id" integer,
	"movie_id" integer,
	"movie_title" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "notifications"
		ADD CONSTRAINT "notifications_user_id_user_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "notifications"
		ADD CONSTRAINT "notifications_actor_id_user_id_fk"
		FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "notifications"
		ADD CONSTRAINT "notifications_rating_id_ratings_id_fk"
		FOREIGN KEY ("rating_id") REFERENCES "ratings"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
	ALTER TABLE "notifications"
		ADD CONSTRAINT "notifications_comment_id_review_comments_id_fk"
		FOREIGN KEY ("comment_id") REFERENCES "review_comments"("id") ON DELETE cascade;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_user_created_idx"
	ON "notifications" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx"
	ON "notifications" ("user_id", "read_at");
