"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Clapperboard, ExternalLink, VideoOff, X } from "lucide-react"
import { useEffect } from "react"

type TrailerModalProps = {
  isOpen: boolean
  onClose: () => void
  trailerKey: string | null
  movieTitle: string
}

export function TrailerModal({ isOpen, onClose, trailerKey, movieTitle }: TrailerModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  const youtubeUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="fixed inset-0 flex items-center justify-center px-4">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_25px_80px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Clapperboard className="h-5 w-5 text-[#C9A84C]" />
                  <p className="truncate font-dm-sans text-white">{movieTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close trailer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="aspect-video w-full bg-black">
                {trailerKey ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1&color=white`}
                    title={`${movieTitle} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                    <VideoOff className="mb-3 h-16 w-16 text-white/20" />
                    <p className="font-dm-sans text-white/40">No trailer available</p>
                    <p className="mt-1 text-sm text-white/20">
                      The trailer for this movie hasn&apos;t been added yet.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between bg-black/40 px-6 py-3">
                <span className="rounded-full bg-[#C9A84C]/20 px-3 py-1 text-xs text-[#C9A84C]">
                  Official Trailer
                </span>

                {youtubeUrl ? (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Watch on YouTube
                  </a>
                ) : (
                  <span className="text-sm text-white/30">Watch on YouTube</span>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
