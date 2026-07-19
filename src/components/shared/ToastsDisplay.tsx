"use client"

import { Check, AlertCircle, Info, X } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

import { slideInRight } from "@/lib/animations"

export type ToastType = "success" | "error" | "info"

export type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastsDisplayProps = {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastsDisplay({ toasts, onDismiss }: ToastsDisplayProps) {
  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5" />
      case "error":
        return <AlertCircle className="h-5 w-5" />
      case "info":
        return <Info className="h-5 w-5" />
    }
  }

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-green-500/50"
      case "error":
        return "border-red-500/50"
      case "info":
        return "border-[#C9A84C]/50"
    }
  }

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "info":
        return "text-[#C9A84C]"
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className={`pointer-events-auto flex items-center gap-3 rounded-lg border bg-[#080808] px-4 py-3 font-dm-sans text-sm ${getBorderColor(toast.type)}`}
          >
            <div className={getTextColor(toast.type)}>{getIcon(toast.type)}</div>
            <p className="text-white">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss toast"
              className="ml-2 text-white/40 transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
