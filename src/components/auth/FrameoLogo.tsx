"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

type FrameoLogoProps = {
  size?: "sm" | "md" | "lg" | "xl"
  /** When false, only the mark image is shown (for lockups that already include type). */
  showWordmark?: boolean
  className?: string
  priority?: boolean
}

const sizeStyles = {
  sm: { height: 32, text: "text-xl" },
  md: { height: 44, text: "text-2xl" },
  lg: { height: 56, text: "text-3xl" },
  xl: { height: 88, text: "text-5xl" },
} as const

export function FrameoLogo({
  size = "md",
  showWordmark = true,
  className,
  priority = false,
}: FrameoLogoProps) {
  const style = sizeStyles[size]

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/frameo.webp"
        alt={showWordmark ? "" : "Frameo"}
        width={Math.round(style.height * 1.35)}
        height={style.height}
        priority={priority}
        className="w-auto object-contain object-left"
        style={{ height: style.height }}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-heading font-semibold tracking-tight text-[var(--color-signal)]",
            style.text,
          )}
        >
          Frameo
        </span>
      ) : null}
    </div>
  )
}

/** @deprecated Use FrameoLogo */
export const CineAILogo = FrameoLogo
