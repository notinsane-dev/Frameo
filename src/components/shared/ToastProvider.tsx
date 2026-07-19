"use client"

import { createContext, useContext, useCallback, useState, type ReactNode } from "react"

import { ToastsDisplay, type Toast, type ToastType } from "@/components/shared/ToastsDisplay"

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    const newToast: Toast = { id, message, type }

    setToasts((prev) => [newToast, ...prev])

    // Auto-dismiss after 3 seconds
    const timeout = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastsDisplay toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider")
  }
  return context
}
