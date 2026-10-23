import { resend } from "@/lib/email/mailer"
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
  welcomeEmailTemplate,
} from "@/lib/email/templates"

const RESEND_ALLOW_TEST_MODE = process.env.RESEND_ALLOW_TEST_MODE === "true"

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const emailFrom = process.env.EMAIL_FROM
  const apiKey = process.env.RESEND_API_KEY

  if (!emailFrom || !apiKey) {
    if (RESEND_ALLOW_TEST_MODE) {
      console.warn(
        `Resend test mode: skipped email "${subject}" to ${to} (EMAIL_FROM or RESEND_API_KEY is not configured).`,
      )
      return
    }
    throw new Error("Missing EMAIL_FROM or RESEND_API_KEY in environment variables")
  }

  const { error } = await resend.emails.send({
    from: `Frameo <${emailFrom}>`,
    to,
    subject,
    html,
  })

  if (error) {
    const isRecipientRestrictionError = error.message.includes(
      "You can only send testing emails to your own email address",
    )

    if (RESEND_ALLOW_TEST_MODE && isRecipientRestrictionError) {
      console.warn(`Resend test mode: skipped email \"${subject}\" to ${to}. ${error.message}`)
      return
    }

    throw new Error(`Resend email failed: ${error.message}`)
  }
}

export async function sendVerificationEmail(email: string, name: string, url: string): Promise<void> {
  await sendEmail(email, "Verify your Frameo account", verificationEmailTemplate(name, url))
}

export async function sendPasswordResetEmail(email: string, name: string, url: string): Promise<void> {
  await sendEmail(email, "Reset your Frameo password", passwordResetEmailTemplate(name, url))
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await sendEmail(email, "Welcome to Frameo", welcomeEmailTemplate(name))
}
