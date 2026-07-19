"use client"

import { Clapperboard } from "lucide-react"

type CineAILogoProps = {
  size?: "sm" | "md" | "lg"
}

const sizeStyles = {
  sm: { icon: "h-4 w-4", text: "text-xl" },
  md: { icon: "h-5 w-5", text: "text-2xl" },
  lg: { icon: "h-6 w-6", text: "text-3xl" },
} as const

export function CineAILogo({ size = "md" }: CineAILogoProps) {
  const style = sizeStyles[size]

  return (
    <div className="flex items-center gap-3">
      <div className="rounded-full bg-[#C9A84C]/15 p-2 text-[#C9A84C]">
        <Clapperboard className={style.icon} />
      </div>
      <span className={`font-heading text-[#C9A84C] ${style.text}`}>CineAI</span>
    </div>
  )
}
