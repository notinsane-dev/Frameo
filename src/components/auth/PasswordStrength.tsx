"use client"

import { motion } from "framer-motion"

type PasswordStrengthProps = {
  password: string
}

const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"]

function getStrength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (password.length === 0) return null

  const score = getStrength(password)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, index) => {
          const active = score > index
          return (
            <motion.div
              key={index}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              className={`h-1 rounded-full ${active ? colors[score] : "bg-white/10"}`}
            />
          )
        })}
      </div>
      <p className="text-xs text-white/40">{labels[score]}</p>
    </div>
  )
}
