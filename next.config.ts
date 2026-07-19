import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  logging: {
    browserToTerminal: true,
  },
  cacheComponents: true,
}

export default withSentryConfig(nextConfig, {
  org: "cineai",
  project: "cineai-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
