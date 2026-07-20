"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"
import { useRef, type ReactNode } from "react"

import { AuthSidePanel } from "@/components/auth/AuthSidePanel"
import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { siteConfig } from "@/config/site"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type AuthShellProps = {
	panelTitle: string
	panelSubtitle: string
	heading: string
	subheading: string
	children: ReactNode
	footer?: ReactNode
}

export function AuthShell({
	panelTitle,
	panelSubtitle,
	heading,
	subheading,
	children,
	footer,
}: AuthShellProps) {
	const rootRef = useRef<HTMLElement>(null)

	useGSAP(
		() => {
			const root = rootRef.current
			if (!root || prefersReducedMotion()) return

			const panelBits = root.querySelectorAll("[data-auth-panel-bit]")
			const formBits = root.querySelectorAll("[data-auth-bit]")
			const posters = root.querySelectorAll("[data-auth-poster]")

			const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

			if (posters.length) {
				tl.from(posters, {
					opacity: 0,
					scale: 1.06,
					duration: 0.9,
					stagger: { each: 0.04, from: "center" },
				})
			}

			tl.from(
				panelBits,
				{
					opacity: 0,
					y: 24,
					filter: "blur(6px)",
					duration: 0.55,
					stagger: 0.08,
				},
				posters.length ? "-=0.55" : 0,
			)

			tl.from(
				formBits,
				{
					opacity: 0,
					y: 18,
					duration: 0.45,
					stagger: 0.05,
				},
				"-=0.35",
			)
		},
		{ scope: rootRef },
	)

	return (
		<section
			ref={rootRef}
			className="relative min-h-screen overflow-hidden bg-[var(--color-ink)] text-[var(--color-text)]"
		>
			<div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
				<AuthSidePanel title={panelTitle} subtitle={panelSubtitle} />

				<div className="relative flex items-center justify-center px-6 py-12 md:px-10">
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,77,61,0.06),transparent_45%)]" />

					<div className="relative w-full max-w-md">
						<div data-auth-bit>
							<Link href="/" aria-label={`${siteConfig.name} home`}>
								<FrameoLogo size="md" />
							</Link>
						</div>

						<header data-auth-bit className="mt-8">
							<h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
								{heading}
							</h1>
							<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
								{subheading}
							</p>
						</header>

						<div className="mt-8 space-y-5">{children}</div>

						{footer ? (
							<div data-auth-bit className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
								{footer}
							</div>
						) : null}
					</div>
				</div>
			</div>
		</section>
	)
}

type AuthCardShellProps = {
	children: ReactNode
}

/** Centered card variant for verify / forgot / reset flows */
export function AuthCardShell({ children }: AuthCardShellProps) {
	const rootRef = useRef<HTMLDivElement>(null)

	useGSAP(
		() => {
			const root = rootRef.current
			if (!root || prefersReducedMotion()) return

			const bits = root.querySelectorAll("[data-auth-bit]")
			gsap.from(bits, {
				opacity: 0,
				y: 18,
				duration: 0.5,
				stagger: 0.06,
				ease: "power3.out",
			})
		},
		{ scope: rootRef },
	)

	return (
		<div
			ref={rootRef}
			className="flex min-h-screen items-center justify-center bg-[var(--color-ink)] px-6 py-12 text-[var(--color-text)]"
		>
			<div className="w-full max-w-md border-t border-[var(--color-border)] pt-8">
				{children}
			</div>
		</div>
	)
}
