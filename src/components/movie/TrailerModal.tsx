"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ExternalLink, VideoOff, X } from "lucide-react"
import { useEffect, useId, useRef } from "react"

const expoOut = [0.16, 1, 0.3, 1] as const

type TrailerModalProps = {
  isOpen: boolean
  onClose: () => void
  trailerKey: string | null
  movieTitle: string
}

export function TrailerModal({ isOpen, onClose, trailerKey, movieTitle }: TrailerModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  const youtubeUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: expoOut }}
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-[var(--color-ink)]/92 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Soft projection wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(255,77,61,0.1),transparent_65%)]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.97, filter: "blur(8px)" }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 12, scale: 0.985, filter: "blur(4px)" }
            }
            transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: expoOut }}
            className="relative z-10 w-full max-w-5xl"
          >
            {/* Chrome header */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.12, duration: 0.35, ease: expoOut }}
              className="mb-3 flex items-end justify-between gap-4 px-1"
            >
              <div className="min-w-0 text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-signal)]">
                  Trailer
                </p>
                <h2
                  id={titleId}
                  className="mt-1 truncate font-heading text-xl font-semibold tracking-tight text-[var(--color-text)] md:text-2xl"
                >
                  {movieTitle}
                </h2>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close trailer"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-ink-elevated)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Player stage */}
            <div className="relative">
              <PlayerFrameCorners reduceMotion={!!reduceMotion} />

              <div className="relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
                {/* Top letterbox accent */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-[var(--color-signal)]/50 to-transparent"
                />

                <div className="aspect-video w-full bg-black">
                  {trailerKey ? (
                    <motion.div
                      key={trailerKey}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4, ease: expoOut }}
                      className="h-full w-full"
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&color=white`}
                        title={`${movieTitle} trailer`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </motion.div>
                  ) : (
                    <EmptyTrailer />
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.35, ease: expoOut }}
              className="mt-3 flex items-center justify-between gap-3 px-1"
            >
              <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-signal)]" />
                Official trailer
              </span>

              {youtubeUrl ? (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-signal)]"
                >
                  Watch on YouTube
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span className="text-sm text-[var(--color-text-muted)]">Unavailable on YouTube</span>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function EmptyTrailer() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 rounded-xl bg-[var(--color-signal-muted)] p-4 text-[var(--color-signal)]">
        <VideoOff className="h-8 w-8" />
      </div>
      <p className="font-heading text-lg font-semibold text-[var(--color-text)]">
        No trailer on this reel
      </p>
      <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
        This title doesn&apos;t have a trailer yet. Check back later or open the movie page for more.
      </p>
    </div>
  )
}

function PlayerFrameCorners({ reduceMotion }: { reduceMotion: boolean }) {
  const corner =
    "pointer-events-none absolute z-[2] h-8 w-8 text-[var(--color-signal)] md:h-10 md:w-10"

  const draw = (delay: number) =>
    reduceMotion
      ? undefined
      : {
          initial: { opacity: 0, pathLength: 0 },
          animate: { opacity: 1, pathLength: 1 },
          transition: { delay: 0.15 + delay, duration: 0.45, ease: expoOut },
        }

  return (
    <>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className={`${corner} -left-1 -top-1 md:-left-2 md:-top-2`}
      >
        <motion.path
          d="M4 16V4h12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          {...draw(0)}
        />
      </svg>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className={`${corner} -right-1 -top-1 md:-right-2 md:-top-2`}
      >
        <motion.path
          d="M24 4h12v12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          {...draw(0.04)}
        />
      </svg>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className={`${corner} -bottom-1 -left-1 md:-bottom-2 md:-left-2`}
      >
        <motion.path
          d="M4 24v12h12"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          {...draw(0.08)}
        />
      </svg>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden
        className={`${corner} -bottom-1 -right-1 md:-bottom-2 md:-right-2`}
      >
        <motion.path
          d="M36 24v12H24"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          {...draw(0.12)}
        />
      </svg>
    </>
  )
}
