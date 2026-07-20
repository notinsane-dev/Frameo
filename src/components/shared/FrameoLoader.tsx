"use client"

import Image from "next/image"
import { motion } from "framer-motion"

import { LoadingSpinner } from "@/components/shared/LoadingSpinner"

type FrameoLoaderProps = {
  title?: string
  subtitle?: string
  fullScreen?: boolean
}

export function FrameoLoader({
  title = "Frameo",
  subtitle = "Finding your next frame…",
  fullScreen = true,
}: FrameoLoaderProps) {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-[70dvh] items-center justify-center bg-[var(--color-ink)] px-6"
          : "flex items-center justify-center px-6 py-16"
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5 text-center"
      >
        <Image
          src="/frameo.webp"
          alt=""
          width={96}
          height={72}
          priority
          className="h-16 w-auto object-contain md:h-20"
        />
        <LoadingSpinner size="lg" />
        <div>
          <p className="font-heading text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {title}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        <motion.div
          className="h-0.5 w-24 overflow-hidden rounded-full bg-[var(--color-border)]"
          aria-hidden
        >
          <motion.div
            className="h-full w-1/2 rounded-full bg-[var(--color-signal)]"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
