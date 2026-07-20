/** Common US TMDB watch provider IDs for profile selection */
export const STREAMING_PROVIDERS = [
	{ id: "8", name: "Netflix" },
	{ id: "9", name: "Prime Video" },
	{ id: "337", name: "Disney+" },
	{ id: "15", name: "Hulu" },
	{ id: "1899", name: "Max" },
	{ id: "350", name: "Apple TV+" },
	{ id: "531", name: "Paramount+" },
	{ id: "386", name: "Peacock" },
	{ id: "283", name: "Crunchyroll" },
	{ id: "43", name: "Starz" },
] as const

export type StreamingProviderId = (typeof STREAMING_PROVIDERS)[number]["id"]

export function providerName(id: string): string {
	return STREAMING_PROVIDERS.find((provider) => provider.id === id)?.name ?? `Provider ${id}`
}
