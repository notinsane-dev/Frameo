export const WATCH_TOGETHER_MOODS = [
	{ id: "cozy", label: "Cozy" },
	{ id: "laughs", label: "Laughs" },
	{ id: "thrills", label: "Thrills" },
	{ id: "romance", label: "Romance" },
	{ id: "mind-benders", label: "Mind-benders" },
	{ id: "crowd-pleaser", label: "Crowd-pleaser" },
] as const

export type WatchTogetherMoodId = (typeof WATCH_TOGETHER_MOODS)[number]["id"]

export function moodLabel(id: string | null | undefined) {
	if (!id) return null
	const preset = WATCH_TOGETHER_MOODS.find(
		(mood) => mood.id === id || mood.label.toLowerCase() === id.toLowerCase(),
	)
	return preset?.label ?? id
}

export function isPresetMood(value: string) {
	return WATCH_TOGETHER_MOODS.some(
		(mood) => mood.id === value || mood.label.toLowerCase() === value.toLowerCase(),
	)
}
