"use client"

import { useRouter } from "next/navigation"
import { useRef } from "react"
import { motion } from "framer-motion"

import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import { listItem, staggerContainerFast } from "@/lib/animations"
import type { TMDBGenre } from "@/lib/tmdb/types"

type GenreShowcaseProps = {
	genres: TMDBGenre[]
}

export function GenreShowcase({ genres }: GenreShowcaseProps) {
	const router = useRouter()
	const ref = useRef(null)
	useRevealOnScroll(ref)

	return (
		<section ref={ref} className="border-y border-[var(--color-border)] py-24 md:py-32">
			<div className="mb-12 px-6 md:px-12">
				<p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]">
					Browse
				</p>
				<h2 className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] md:text-5xl">
					Find a mood
				</h2>
			</div>

			<motion.div
				className="flex flex-col"
				variants={staggerContainerFast}
				initial="hidden"
				whileInView="visible"
				viewport={{ once: true, amount: 0.1 }}
			>
				{genres.slice(0, 8).map((genre) => (
					<motion.button
						key={genre.id}
						type="button"
						variants={listItem}
						whileHover={{ x: 8 }}
						whileTap={{ scale: 0.995 }}
						onClick={() => router.push(`/explore?genre=${genre.id}`)}
						className="group flex items-center justify-between border-t border-[var(--color-border)] px-6 py-6 text-left transition-colors hover:bg-[var(--color-signal-muted)] md:px-12 md:py-8"
					>
						<span className="font-heading text-3xl font-semibold tracking-tight text-[var(--color-text)] transition-colors group-hover:text-[var(--color-signal)] md:text-5xl">
							{genre.name}
						</span>
						<span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] transition-colors group-hover:text-[var(--color-signal)]">
							Open
						</span>
					</motion.button>
				))}
				<div className="border-t border-[var(--color-border)]" />
			</motion.div>
		</section>
	)
}
