"use client"

import { Loader2 } from "lucide-react"

type SocialAuthButtonProps = {
  provider: "google"
  onClick: () => void
  isLoading?: boolean
  text: string
}

export function SocialAuthButton({ onClick, isLoading = false, text }: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 text-sm font-semibold text-[#080808] transition-colors hover:bg-gray-50 disabled:opacity-70"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#EA4335" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
          <path fill="#4A90E2" d="M3.97 10.71A5.41 5.41 0 0 1 3.7 9c0-.6.1-1.18.27-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3.01-2.33z" />
          <path fill="#FBBC05" d="M9 3.58c1.32 0 2.5.45 3.44 1.33l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
      )}
      {text}
    </button>
  )
}
