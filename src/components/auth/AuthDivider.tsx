"use client"

type AuthDividerProps = {
	text: string
}

export function AuthDivider({ text }: AuthDividerProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-px flex-1 bg-[var(--color-border)]" />
			<span className="text-xs text-[var(--color-text-muted)]">{text}</span>
			<div className="h-px flex-1 bg-[var(--color-border)]" />
		</div>
	)
}
