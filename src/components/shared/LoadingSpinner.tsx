"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg"
  className?: string
  label?: string
}

const sizeMap = {
  sm: { box: "h-6 w-6", ring: 2, mark: "h-2.5 w-2.5" },
  md: { box: "h-10 w-10", ring: 2.5, mark: "h-4 w-4" },
  lg: { box: "h-16 w-16", ring: 3, mark: "h-6 w-6" },
} as const

function FrameMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LoadingSpinner({ size = "md", className, label }: LoadingSpinnerProps) {
  const dims = sizeMap[size]

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? "Loading"}
    >
      <div className={cn("relative", dims.box)}>
        <motion.span
          className="absolute inset-0 rounded-full border-[var(--color-signal-muted)]"
          style={{ borderWidth: dims.ring }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-0 rounded-full border-transparent border-t-[var(--color-signal)] border-r-[var(--color-signal)]"
          style={{ borderWidth: dims.ring }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.span
          className="absolute inset-0 flex items-center justify-center text-[var(--color-signal)]"
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.92, 1, 0.92] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <FrameMark className={dims.mark} />
        </motion.span>
      </div>
      {label ? (
        <p className="text-xs tracking-wide text-[var(--color-text-secondary)]">{label}</p>
      ) : null}
      <span className="sr-only">{label ?? "Loading"}</span>
    </div>
  )
}
