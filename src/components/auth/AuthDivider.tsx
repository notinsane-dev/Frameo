"use client"

type AuthDividerProps = {
  text: string
}

export function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-sm text-white/30">{text}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  )
}
