import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: Date | string): string {
  const target = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - target.getTime()

  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now"

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  const year = 365 * day

  if (diffMs < minute) return "just now"
  if (diffMs < hour) {
    const value = Math.floor(diffMs / minute)
    return `${value} minute${value === 1 ? "" : "s"} ago`
  }
  if (diffMs < day) {
    const value = Math.floor(diffMs / hour)
    return `${value} hour${value === 1 ? "" : "s"} ago`
  }
  if (diffMs < week) {
    const value = Math.floor(diffMs / day)
    return `${value} day${value === 1 ? "" : "s"} ago`
  }
  if (diffMs < month) {
    const value = Math.floor(diffMs / week)
    return `${value} week${value === 1 ? "" : "s"} ago`
  }
  if (diffMs < year) {
    const value = Math.floor(diffMs / month)
    return `${value} month${value === 1 ? "" : "s"} ago`
  }

  const value = Math.floor(diffMs / year)
  return `${value} year${value === 1 ? "" : "s"} ago`
}
