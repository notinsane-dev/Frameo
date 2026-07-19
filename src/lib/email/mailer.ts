import { Resend } from "resend"

const RESEND_API_KEY = process.env.RESEND_API_KEY

if (!RESEND_API_KEY) {
  throw new Error("Missing RESEND_API_KEY in environment variables")
}

export const resend = new Resend(RESEND_API_KEY)
