"use client"

import { cn } from "@/lib/utils"

type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-[3px]",
  lg: "h-16 w-16 border-4",
} as const

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-[#C9A84C]/25 border-t-[#C9A84C]",
          sizeClasses[size],
        )}
      />
    </div>
  )
}
