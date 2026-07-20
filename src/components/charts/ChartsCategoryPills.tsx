"use client"

import { motion } from "framer-motion"

import { listItem, staggerContainerFast } from "@/lib/animations"
import { cn } from "@/lib/utils"

const categories = [
	{ id: "movies", label: "Movies" },
	{ id: "actors", label: "Actors" },
] as const

export type ChartsCategory = (typeof categories)[number]["id"]

type ChartsCategoryPillsProps = {
	value: ChartsCategory
	onChange: (category: ChartsCategory) => void
}

export function ChartsCategoryPills({ value, onChange }: ChartsCategoryPillsProps) {
	return (
		<motion.div
			className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			variants={staggerContainerFast}
			initial="hidden"
			animate="visible"
			aria-label="Chart category"
		>
			{categories.map((category) => {
				const selected = value === category.id
				return (
					<motion.button
						key={category.id}
						type="button"
						variants={listItem}
						whileTap={{ scale: 0.97 }}
						onClick={() => onChange(category.id)}
						className={cn(
							"flex-none rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300",
							selected
								? "border-[var(--color-signal)] bg-[var(--color-signal)] text-[var(--color-ink)]"
								: "border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-border)] hover:text-[var(--color-text)]",
						)}
					>
						{category.label}
					</motion.button>
				)
			})}
		</motion.div>
	)
}
