import Link from "next/link"
import { Suspense } from "react"
import { connection } from "next/server"

import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { FooterMotion } from "@/components/layout/FooterMotion"
import { siteConfig } from "@/config/site"

const linkGroups = [
	{
		title: "Explore",
		links: [
			{ label: "Home", href: "/" },
			{ label: "Explore", href: "/explore" },
			{ label: "Recommendations", href: "/recommendations" },
			{ label: "Watchlist", href: "/watchlist" },
		],
	},
	{
		title: "Social",
		links: [
			{ label: "Together", href: "/watch-together" },
			{ label: "Taste twins", href: "/taste-twins" },
			{ label: "Smart Log", href: "/diary" },
			{ label: "Friends", href: "/friends" },
		],
	},
	{
		title: "Account",
		links: [
			{ label: "Profile", href: "/profile" },
			{ label: "Terms", href: "/terms" },
			{ label: "Privacy", href: "/privacy" },
		],
	},
] as const

async function CopyrightYear() {
	await connection()
	return <>{new Date().getFullYear()}</>
}

export function Footer() {
	return (
		<FooterMotion>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-signal)]/40 to-transparent"
			/>

			<div className="mx-auto w-full max-w-6xl px-6 py-14 md:px-10 md:py-16">
				<div className="grid gap-10 md:grid-cols-[1.2fr_repeat(3,minmax(0,0.7fr))] md:gap-8">
					<div data-footer-bit className="max-w-sm">
						<Link href="/" aria-label={`${siteConfig.name} home`} className="inline-flex">
							<FrameoLogo size="lg" />
						</Link>
						<p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
							{siteConfig.description}
						</p>
					</div>

					{linkGroups.map((group) => (
						<nav key={group.title} data-footer-bit aria-label={group.title}>
							<p className="text-xs font-medium text-[var(--color-text-muted)]">
								{group.title}
							</p>
							<ul className="mt-3 space-y-2">
								{group.links.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</nav>
					))}
				</div>

				<div
					data-footer-line
					className="mt-12 h-px origin-left bg-[var(--color-border)]"
				/>

				<div data-footer-bit className="mt-6 text-xs text-[var(--color-text-muted)]">
					<p>
						©{" "}
						<Suspense fallback={<span className="inline-block w-8" aria-hidden />}>
							<CopyrightYear />
						</Suspense>{" "}
						{siteConfig.name}
					</p>
				</div>
			</div>
		</FooterMotion>
	)
}
