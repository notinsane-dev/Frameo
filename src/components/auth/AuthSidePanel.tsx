"use client"

import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { getImageUrl } from "@/lib/tmdb/helpers"

const posterPaths = [
	"/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg",
	"/hU42CRk14JuPEdqZG3AWmagiPAP.jpg",
	"/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
	"/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg",
	"/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
	"/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg",
	"/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
	"/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
	"/fTrQsdMS2MUw00RnzH0r3JWHhts.jpg",
]

type AuthSidePanelProps = {
	title: string
	subtitle: string
}

export function AuthSidePanel({ title, subtitle }: AuthSidePanelProps) {
	return (
		<div className="relative hidden overflow-hidden border-r border-[var(--color-border)] lg:block">
			<div className="absolute inset-0 grid grid-cols-3 gap-2 p-3 opacity-[0.22]">
				{posterPaths.map((path) => (
					<div
						key={path}
						data-auth-poster
						className="rounded-md bg-cover bg-center"
						style={{
							backgroundImage: `url(${getImageUrl(path, "w500")})`,
						}}
					/>
				))}
			</div>

			<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,77,61,0.22),transparent_42%),linear-gradient(160deg,rgba(11,13,18,0.72),rgba(11,13,18,0.96))]" />

			<div className="relative z-10 flex h-full flex-col justify-between p-10 pb-14">
				<div data-auth-panel-bit>
					<FrameoLogo size="md" />
				</div>

				<div>
					<h2
						data-auth-panel-bit
						className="max-w-lg font-heading text-4xl font-bold leading-[1.08] tracking-tight text-[var(--color-text)] text-balance xl:text-5xl"
					>
						{title}
					</h2>
					<p
						data-auth-panel-bit
						className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)] text-pretty"
					>
						{subtitle}
					</p>
				</div>
			</div>
		</div>
	)
}
