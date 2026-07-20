export function verificationEmailTemplate(name: string, url: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background:#0B0D12; color:#ffffff; font-family:Arial,sans-serif; margin:0; padding:0;">
    <div style="max-width:560px; margin:40px auto; padding:40px; background:#12151c; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
      <div style="text-align:center; margin-bottom:32px;">
        <h1 style="color:#FF4D3D; font-size:28px; margin:0;">Frameo</h1>
      </div>

      <h2 style="color:#ffffff; font-size:22px; margin:0 0 12px;">Verify your email</h2>
      <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 28px;">
        Hey ${name}! Welcome to Frameo. Click the button below to verify your email and start discovering movies.
      </p>

      <div style="text-align:center; margin-bottom:28px;">
        <a href="${url}" style="display:inline-block; background:#FF4D3D; color:#0B0D12; font-weight:700; font-size:15px; padding:14px 36px; border-radius:999px; text-decoration:none;">
          Verify Email Address
        </a>
      </div>

      <p style="color:rgba(255,255,255,0.3); font-size:13px; text-align:center; margin:0 0 24px;">
        This link expires in 24 hours. If you didn't create an account, ignore this email.
      </p>

      <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:24px 0;" />

      <p style="color:rgba(255,255,255,0.2); font-size:12px; text-align:center; margin:0;">
        © ${new Date().getFullYear()} Frameo. Powered by TMDB & Gemini AI.
      </p>
    </div>
  </body>
  </html>
  `
}

export function passwordResetEmailTemplate(name: string, url: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background:#0B0D12; color:#ffffff; font-family:Arial,sans-serif; margin:0; padding:0;">
    <div style="max-width:560px; margin:40px auto; padding:40px; background:#12151c; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
      <div style="text-align:center; margin-bottom:32px;">
        <h1 style="color:#FF4D3D; font-size:28px; margin:0;">Frameo</h1>
      </div>

      <h2 style="color:#ffffff; font-size:22px; margin:0 0 12px;">Reset your password</h2>
      <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 28px;">
        You requested a password reset. Click below to set a new password.
      </p>

      <div style="text-align:center; margin-bottom:28px;">
        <a href="${url}" style="display:inline-block; background:#FF4D3D; color:#0B0D12; font-weight:700; font-size:15px; padding:14px 36px; border-radius:999px; text-decoration:none;">
          Reset Password
        </a>
      </div>

      <p style="color:rgba(255,255,255,0.3); font-size:13px; text-align:center; margin:0 0 12px;">
        This link expires in 1 hour.
      </p>
      <p style="color:rgba(255,130,130,0.85); font-size:13px; text-align:center; margin:0 0 24px;">
        If you didn't request this, your account may be at risk. Contact support.
      </p>

      <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:24px 0;" />

      <p style="color:rgba(255,255,255,0.2); font-size:12px; text-align:center; margin:0;">
        © ${new Date().getFullYear()} Frameo. Powered by TMDB & Gemini AI.
      </p>
    </div>
  </body>
  </html>
  `
}

export function welcomeEmailTemplate(name: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const year = new Date().getFullYear()

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background:#0B0D12; color:#ffffff; font-family:Arial,sans-serif; margin:0; padding:0;">
    <div style="max-width:560px; margin:40px auto; padding:40px; background:#12151c; border-radius:16px; border:1px solid rgba(255,255,255,0.08);">
      <div style="text-align:center; margin-bottom:32px;">
        <h1 style="color:#FF4D3D; font-size:28px; margin:0;">Frameo</h1>
      </div>

      <h2 style="color:#ffffff; font-size:22px; margin:0 0 12px;">Welcome to Frameo</h2>
      <p style="color:rgba(255,255,255,0.6); font-size:15px; line-height:1.6; margin:0 0 28px;">
        Hi ${name}, your email is verified. Start exploring AI-powered movie recommendations.
      </p>

      <div style="text-align:center; margin-bottom:28px;">
        <a href="${appUrl}" style="display:inline-block; background:#FF4D3D; color:#0B0D12; font-weight:700; font-size:15px; padding:14px 36px; border-radius:999px; text-decoration:none;">
          Explore Movies
        </a>
      </div>

      <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:24px 0;" />

      <p style="color:rgba(255,255,255,0.2); font-size:12px; text-align:center; margin:0;">
        © ${year} Frameo. Powered by TMDB & Gemini AI.
      </p>
    </div>
  </body>
  </html>
  `
}
