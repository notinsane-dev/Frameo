import { siteConfig } from "@/config/site"

function baseUrl() {
	return siteConfig.url.replace(/\/$/, "")
}

export function profileUrl(userId: string) {
	return `${baseUrl()}/profile/${userId}`
}

export function inviteUrl(username: string) {
	return `${baseUrl()}/invite/${encodeURIComponent(username.trim().toLowerCase())}`
}
