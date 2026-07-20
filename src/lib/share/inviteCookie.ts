export const INVITE_COOKIE = "frameo_invite_ref"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export function readInviteRef(): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${INVITE_COOKIE}=`))
	if (!match) return null
	const value = decodeURIComponent(match.split("=").slice(1).join("=")).trim().toLowerCase()
	return value || null
}

export function writeInviteRef(username: string) {
	if (typeof document === "undefined") return
	const normalized = username.trim().toLowerCase()
	if (!normalized) return
	document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`
}

export function clearInviteRef() {
	if (typeof document === "undefined") return
	document.cookie = `${INVITE_COOKIE}=; path=/; max-age=0; samesite=lax`
}
