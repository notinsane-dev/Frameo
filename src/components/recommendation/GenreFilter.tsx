"use client"

import type { TMDBGenre } from "@/lib/tmdb/types"
import { cn } from "@/lib/utils"

type GenreFilterProps = {
	selected: string
	onChange: (genre: string) => void
	genres: TMDBGenre[]
}

export function GenreFilter({ selected, onChange, genres }: GenreFilterProps) {
	const displayGenres = [{ id: "", name: "Any genre" }, ...genres.slice(0, 12)]

	return (
		<div className="flex flex-wrap gap-2">
			{displayGenres.map((genre) => {
				const value = genre.id?.toString() || ""
				const active = selected === value
				return (
					<button
						key={genre.id || "any"}
						type="button"
						onClick={() => onChange(value)}
						aria-pressed={active}
						className={cn(
							"rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
							active
								? "border-[var(--color-signal)] bg-[var(--color-signal)] text-[var(--color-ink)]"
								: "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]",
						)}
					>
						{genre.name}
					</button>
				)
			})}
		</div>
	)
}
