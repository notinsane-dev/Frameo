import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { username } from "better-auth/plugins"

import { getMongoDb } from "@/lib/db/mongodb"
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

const mongoDb = await getMongoDb()

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
  database: mongodbAdapter(mongoDb),
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
  plugins: [username()],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      username: { type: "string", required: false, unique: true },
      bio: { type: "string", required: false },
      authProvider: { type: "string", required: false, defaultValue: "email" },
      isPublic: { type: "boolean", required: false, defaultValue: true },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
