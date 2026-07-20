"use client"

import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type AuthInputProps = {
	label: string
	type?: string
	placeholder?: string
	value: string
	onChange: (value: string) => void
	icon?: LucideIcon
	rightIcon?: React.ReactNode
	error?: string
	success?: string
	disabled?: boolean
	className?: string
	onFocus?: () => void
	onBlur?: () => void
	maxLength?: number
}

export function AuthInput({
	label,
	type = "text",
	placeholder,
	value,
	onChange,
	icon: Icon,
	rightIcon,
	error,
	success,
	disabled,
	className,
	onFocus,
	onBlur,
	maxLength,
}: AuthInputProps) {
	return (
		<div className={cn("space-y-1.5", className)}>
			<label className="text-sm text-[var(--color-text-secondary)]">{label}</label>
			<div className="relative">
				{Icon ? (
					<Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
				) : null}
				<input
					type={type}
					value={value}
					placeholder={placeholder}
					onChange={(event) => onChange(event.target.value)}
					onFocus={onFocus}
					onBlur={onBlur}
					disabled={disabled}
					maxLength={maxLength}
					className={cn(
						"w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)] disabled:opacity-70",
						Icon ? "pl-10" : "",
						rightIcon ? "pr-10" : "",
						error ? "border-red-500/50" : "",
						success ? "border-emerald-500/50" : "",
					)}
				/>
				{rightIcon ? (
					<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
						{rightIcon}
					</span>
				) : null}
			</div>
			{error ? <p className="text-xs text-red-400">{error}</p> : null}
			{!error && success ? <p className="text-xs text-emerald-400">{success}</p> : null}
		</div>
	)
}
