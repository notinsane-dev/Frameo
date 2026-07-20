"use client"

import { cn } from "@/lib/utils"

type MoodSelectorProps = {
	selected: string
	onChange: (mood: string) => void
}

const moods = [
	{ id: "feel-good", label: "Feel good", hint: "Warm & uplifting" },
	{ id: "emotional", label: "Emotional", hint: "Heart-first" },
	{ id: "thrilling", label: "Thrilling", hint: "Pulse up" },
	{ id: "funny", label: "Funny", hint: "Laugh track" },
	{ id: "thoughtful", label: "Thoughtful", hint: "Slow burn" },
	{ id: "relaxing", label: "Relaxing", hint: "Low stakes" },
	{ id: "intense", label: "Intense", hint: "High voltage" },
	{ id: "romantic", label: "Romantic", hint: "Soft focus" },
]

export function MoodSelector({ selected, onChange }: MoodSelectorProps) {
	return (
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{moods.map((mood) => {
				const active = selected === mood.id
				return (
					<button
						key={mood.id}
						type="button"
						onClick={() => onChange(mood.id)}
						aria-pressed={active}
						className={cn(
							"rounded-xl border px-3 py-3 text-left transition-colors",
							active
								? "border-[var(--color-signal-border)] bg-[var(--color-signal-muted)]"
								: "border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:border-[var(--color-border-hover)]",
						)}
					>
						<span
							className={cn(
								"block text-sm font-semibold",
								active ? "text-[var(--color-signal)]" : "text-[var(--color-text)]",
							)}
						>
							{mood.label}
						</span>
						<span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">
							{mood.hint}
						</span>
					</button>
				)
			})}
		</div>
	)
}
