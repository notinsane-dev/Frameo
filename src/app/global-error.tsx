"use client"

import { JetBrains_Mono, Outfit, Space_Grotesk } from "next/font/google"
import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

import { StatusScene } from "@/components/shared/StatusScene"
import { cn } from "@/lib/utils"

import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html
      lang="en"
      className={cn(outfit.variable, spaceGrotesk.variable, jetBrainsMono.variable)}
    >
      <body className="bg-[var(--color-ink)] font-sans antialiased">
        <StatusScene
          code="500"
          eyebrow="System cut"
          title="Frameo couldn't load"
          description="A critical error stopped the app before this page could render. Retrying often clears it."
          detail={
            <>
              <span className="block text-[var(--color-text-secondary)]">{error.message}</span>
              {error.digest ? (
                <span className="mt-2 block text-[var(--color-text-muted)]">
                  digest {error.digest}
                </span>
              ) : null}
            </>
          }
          actions={[
            { label: "Try again", onClick: reset },
            { label: "Go home", href: "/", variant: "secondary" },
          ]}
        />
      </body>
    </html>
  )
}
