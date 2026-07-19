"use client"

import * as Sentry from "@sentry/nextjs"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6 py-20">
      <div className="glass-card gold-glow max-w-xl rounded-3xl p-8 text-center">
        <AlertCircle className="mx-auto mb-4 h-14 w-14 text-red-400/70" />
        <h1 className="font-playfair text-4xl text-white">Something went wrong</h1>
        <p className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white/40">
          {error.message}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button onClick={reset} className="rounded-full bg-[#C9A84C] px-6 py-3 font-semibold text-[#080808]">
            Try Again
          </button>
          <Link href="/" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
