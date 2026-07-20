/** Same-origin relative path only — blocks open redirects. */
export function safeNextPath(value: string | null | undefined, fallback = "/") {
	if (!value) return fallback
	const trimmed = value.trim()
	if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback
	if (trimmed.includes("://") || trimmed.includes("\\")) return fallback
	return trimmed
}
