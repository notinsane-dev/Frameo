"use client"

type PasswordStrengthProps = {
	password: string
}

const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"]
const colors = [
	"bg-red-500",
	"bg-orange-500",
	"bg-yellow-500",
	"bg-lime-500",
	"bg-emerald-500",
]

function getStrength(password: string) {
	let score = 0
	if (password.length >= 8) score += 1
	if (/[A-Z]/.test(password)) score += 1
	if (/[0-9]/.test(password)) score += 1
	if (/[^A-Za-z0-9]/.test(password)) score += 1
	return score
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
	if (password.length === 0) return null

	const score = getStrength(password)

	return (
		<div className="space-y-2">
			<div className="grid grid-cols-4 gap-1">
				{Array.from({ length: 4 }).map((_, index) => {
					const active = score > index
					return (
						<div
							key={index}
							className={`h-1 rounded-full transition-colors duration-200 ${
								active ? colors[score] : "bg-[var(--color-border)]"
							}`}
						/>
					)
				})}
			</div>
			<p className="text-xs text-[var(--color-text-muted)]">{labels[score]}</p>
		</div>
	)
}
