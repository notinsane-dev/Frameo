"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { ExternalLink } from "lucide-react"

import { listItem, staggerContainer } from "@/lib/animations"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBPerson } from "@/lib/tmdb/types"

type RankedActorListProps = {
	actors: TMDBPerson[]
}

function knownForTitles(person: TMDBPerson) {
	return (person.known_for ?? [])
		.filter((item) => item.media_type === "movie" || Boolean(item.title))
		.map((item) => item.title || item.name)
		.filter(Boolean)
		.slice(0, 2)
		.join(" · ")
}

export function RankedActorList({ actors }: RankedActorListProps) {
	if (actors.length === 0) {
		return (
			<div className="rounded-2xl border border-[var(--color-border)] px-6 py-12 text-center">
				<p className="text-sm text-[var(--color-text-secondary)]">
					No actors ranked for this period yet.
				</p>
			</div>
		)
	}

	return (
		<motion.div
			className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
			variants={staggerContainer}
			initial="hidden"
			animate="visible"
		>
			{actors.map((actor, index) => {
				const knownFor = knownForTitles(actor)
				const href = `https://www.themoviedb.org/person/${actor.id}`

				return (
					<motion.a
						key={actor.id}
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						variants={listItem}
						className="group relative block"
					>
						<span className="pointer-events-none absolute -bottom-1 left-0 z-0 font-heading text-6xl font-extrabold leading-none text-[var(--color-text)]/[0.06] select-none md:text-7xl">
							{String(index + 1).padStart(2, "0")}
						</span>
						<div className="relative z-10">
							<div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-colors group-hover:border-[var(--color-signal-border)]">
								{actor.profile_path ? (
									<Image
										src={tmdb.getImageUrl(actor.profile_path, "w500")}
										alt={actor.name}
										fill
										className="object-cover"
										sizes="(max-width: 640px) 45vw, 200px"
									/>
								) : (
									<div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
										No photo
									</div>
								)}
							</div>
							<div className="mt-3 flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="truncate font-medium text-[var(--color-text)] group-hover:text-[var(--color-signal)]">
										{actor.name}
									</p>
									{knownFor ? (
										<p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">
											{knownFor}
										</p>
									) : null}
								</div>
								<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						</div>
					</motion.a>
				)
			})}
		</motion.div>
	)
}
