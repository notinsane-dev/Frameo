"use client"

import { cn } from "@/lib/utils"

const periods = [
	{ id: "month", label: "Month" },
	{ id: "year", label: "Year" },
] as const

export type ChartsPeriod = (typeof periods)[number]["id"]

type ChartsPeriodTabsProps = {
	value: ChartsPeriod
	onChange: (period: ChartsPeriod) => void
}

export function ChartsPeriodTabs({ value, onChange }: ChartsPeriodTabsProps) {
	return (
		<nav
			aria-label="Chart period"
			className="flex gap-1 border-b border-[var(--color-border)]"
		>
			{periods.map((period) => {
				const active = value === period.id
				return (
					<button
						key={period.id}
						type="button"
						onClick={() => onChange(period.id)}
						className={cn(
							"relative px-4 py-3 text-sm font-medium transition-colors",
							active
								? "text-[var(--color-text)]"
								: "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
						)}
					>
						{period.label}
						{active ? (
							<span className="absolute inset-x-4 bottom-0 h-0.5 bg-[var(--color-signal)]" />
						) : null}
					</button>
				)
			})}
		</nav>
	)
}
