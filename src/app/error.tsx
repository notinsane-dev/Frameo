"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { StatusScene } from "@/components/shared/StatusScene"

export default function Error({
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
    <StatusScene
      code="ERR"
      eyebrow="Reel interrupted"
      title="Something cut the take"
      description="We hit an unexpected glitch while loading this frame. Try again, or head home and pick a new scene."
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
  )
}
