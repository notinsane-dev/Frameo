import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { username } from "better-auth/plugins"

import { db } from "@/lib/db"
import * as authSchema from "@/lib/db/auth-schema"
import {
	sendPasswordResetEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from "@/lib/email/send"

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET
const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const RESEND_ALLOW_TEST_MODE = process.env.RESEND_ALLOW_TEST_MODE === "true"

if (!BETTER_AUTH_SECRET) {
	throw new Error("Missing BETTER_AUTH_SECRET in environment variables")
}

if (!BETTER_AUTH_URL) {
	throw new Error("Missing BETTER_AUTH_URL in environment variables")
}

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	throw new Error("Missing Google OAuth environment variables")
}

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: !RESEND_ALLOW_TEST_MODE,
		minPasswordLength: 8,
		maxPasswordLength: 64,
		sendResetPassword: async ({ user, url }) => {
			await sendPasswordResetEmail(user.email, user.name, url)
		},
	},
	emailVerification: {
		sendOnSignUp: !RESEND_ALLOW_TEST_MODE,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendVerificationEmail(user.email, user.name, url)
		},
		afterEmailVerification: async (user) => {
			await sendWelcomeEmail(user.email, user.name)
		},
	},
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
		},
	},
	plugins: [
		username({
			minUsernameLength: 3,
			maxUsernameLength: 20,
			usernameValidator: (value) => /^[a-zA-Z0-9_]{3,20}$/.test(value),
		}),
		// Must be last — ensures Set-Cookie works from Next.js server actions / handlers
		nextCookies(),
	],
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
		},
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const provider =
						typeof (user as { authProvider?: string }).authProvider === "string"
							? (user as { authProvider?: string }).authProvider
							: undefined
					return {
						data: {
							...user,
							authProvider: provider || "email",
						},
					}
				},
			},
		},
		account: {
			create: {
				after: async (account) => {
					if (account.providerId === "google") {
						const { eq } = await import("drizzle-orm")
						const { user } = await import("@/lib/db/auth-schema")
						await db
							.update(user)
							.set({ authProvider: "google", updatedAt: new Date() })
							.where(eq(user.id, account.userId))
					}
				},
			},
		},
	},
	user: {
		additionalFields: {
			bio: { type: "string", required: false, input: true },
			isPublic: { type: "boolean", required: false, defaultValue: true, input: true },
			// Server-owned — not writable from client updateUser / signup body
			authProvider: {
				type: "string",
				required: false,
				defaultValue: "email",
				input: false,
			},
			imagePublicId: { type: "string", required: false, input: false },
			avatarUpdatedAt: { type: "date", required: false, input: false },
			usernameIsTemporary: {
				type: "boolean",
				required: false,
				defaultValue: false,
				input: false,
			},
			usernameUpdatedAt: { type: "date", required: false, input: false },
		},
	},
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
