"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"
import { useRef } from "react"

import { WatchlistView } from "@/components/watchlist/WatchlistView"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { useWatchlist } from "@/hooks/useWatchlist"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function WatchlistPage() {
	const { watchlist } = useWatchlist()
	const headerRef = useRef<HTMLElement>(null)

	useGSAP(
		() => {
			if (!headerRef.current || prefersReducedMotion()) return
			const bits = headerRef.current.querySelectorAll("[data-wl-intro]")
			gsap.fromTo(
				bits,
				{ opacity: 0, y: 14 },
				{ opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" },
			)
		},
		{ scope: headerRef },
	)

	return (
		<AuthGuard>
			<div className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10">
				<div className="mx-auto max-w-6xl space-y-8">
					<header ref={headerRef} className="max-w-2xl">
						<p
							data-wl-intro
							className="text-xs font-medium text-[var(--color-text-muted)]"
						>
							Watchlist
						</p>
						<h1
							data-wl-intro
							className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl"
						>
							Saved for later
						</h1>
						<p
							data-wl-intro
							className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"
						>
							{watchlist.length > 0
								? `${watchlist.length} film${watchlist.length === 1 ? "" : "s"} queued for your next night in.`
								: "Build a queue from Explore, then come back when you’re ready."}
						</p>
						<div data-wl-intro className="mt-4 flex flex-wrap gap-3 text-sm">
							<Link
								href="/explore"
								className="text-[var(--color-signal)] underline-offset-2 hover:underline"
							>
								Explore films
							</Link>
							<span className="text-[var(--color-border-hover)]">·</span>
							<Link
								href="/profile?tab=stats"
								className="text-[var(--color-text-muted)] underline-offset-2 hover:text-[var(--color-text-secondary)] hover:underline"
							>
								View stats
							</Link>
						</div>
					</header>

					<WatchlistView variant="page" />
				</div>
			</div>
		</AuthGuard>
	)
}
