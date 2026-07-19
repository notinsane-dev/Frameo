"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AuthInputProps = {
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  icon?: LucideIcon
  rightIcon?: React.ReactNode
  error?: string
  success?: string
  disabled?: boolean
  className?: string
}

export function AuthInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightIcon,
  error,
  success,
  disabled,
  className,
}: AuthInputProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm text-white/70">{label}</label>
      <div className="relative">
        {Icon ? <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /> : null}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 transition-all duration-200 focus:bg-white/8 focus:outline-none focus:border-[#C9A84C]/50 disabled:opacity-70",
            Icon ? "pl-10" : "",
            rightIcon ? "pr-10" : "",
            error ? "border-red-500/50" : "",
            success ? "border-green-500/50" : "",
          )}
        />
        {rightIcon ? <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50">{rightIcon}</span> : null}
      </div>
      {error ? <p className="text-xs text-red-400/90">{error}</p> : null}
      {!error && success ? <p className="text-xs text-green-400/90">{success}</p> : null}
    </div>
  )
}
