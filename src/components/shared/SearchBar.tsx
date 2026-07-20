"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Search, X } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type SearchBarProps = {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  searchOnType?: boolean
  submitOnEnter?: boolean
  defaultValue?: string
  /** Disable shared layout focus ring (avoids ghosting when multiple SearchBars mount). */
  disableFocusLayout?: boolean
}

export function SearchBar({
  onSearch,
  placeholder = "Search movies...",
  className,
  searchOnType = true,
  submitOnEnter = false,
  defaultValue = "",
  disableFocusLayout = false,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (!searchOnType) return

    const timeout = setTimeout(() => {
      onSearch(value.trim())
    }, 300)

    return () => clearTimeout(timeout)
  }, [onSearch, searchOnType, value])

  return (
    <div className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full border bg-[var(--color-bg-card)] transition-all duration-300",
          isFocused
            ? "border-[var(--color-signal-border)] shadow-[0_0_28px_rgba(255,77,61,0.2)]"
            : "border-[var(--color-border)]",
        )}
      >
        {!disableFocusLayout ? (
          <AnimatePresence>
            {isFocused ? (
              <motion.div
                layoutId="search-focus-ring"
                className="pointer-events-none absolute inset-0 rounded-full border border-[var(--color-signal-border)]"
              />
            ) : null}
          </AnimatePresence>
        ) : null}

        <div className="relative flex items-center gap-2 px-4 py-3">
          <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(event) => {
              if (!submitOnEnter || event.key !== "Enter") return

              event.preventDefault()
              onSearch(value.trim())
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {value ? (
            <button
              type="button"
              onClick={() => {
                setValue("")
                onSearch("")
              }}
              className="rounded-full p-1 text-[var(--color-text-secondary)] transition-colors duration-200 hover:text-[var(--color-text)]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
