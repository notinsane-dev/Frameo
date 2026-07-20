export function generateUsernameSuggestions(name: string): string[] {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15)

  const fallback = base.length > 0 ? base : "frameouser"

  const hash = Array.from(fallback).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const suffix2 = String((hash % 90) + 10)
  const suffix3 = String((hash % 900) + 100)

  const suggestions = [
    fallback,
    `${fallback}_${suffix2}`,
    `${fallback}${suffix3}`,
    `the_${fallback}`,
    `${fallback}_movies`,
  ].filter((value) => value.length >= 3 && value.length <= 20)

  return [...new Set(suggestions)].slice(0, 3)
}

export function formatUsername(username: string): string {
  return `@${username.toLowerCase()}`
}

export function stripAtSign(input: string): string {
  return input.startsWith("@") ? input.slice(1) : input
}
