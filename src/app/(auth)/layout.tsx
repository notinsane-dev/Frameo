export default function AuthLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<main className="min-h-screen bg-[var(--color-ink)] text-[var(--color-text)]">
			{children}
		</main>
	)
}
