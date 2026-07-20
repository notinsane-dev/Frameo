"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollToPlugin)

export type LegalTocItem = {
	id: string
	label: string
}

type LegalDocumentProps = {
	title: string
	description: string
	updated: string
	toc: LegalTocItem[]
	related: { href: string; label: string }
	children: ReactNode
}

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function LegalSection({
	id,
	title,
	children,
}: {
	id: string
	title: string
	children: ReactNode
}) {
	return (
		<section id={id} data-legal-section className="scroll-mt-24">
			<h2
				data-legal-heading
				className="font-heading text-xl font-bold tracking-tight text-[var(--color-text)]"
			>
				{title}
			</h2>
			<div
				data-legal-body
				className="mt-3 space-y-3 text-[0.9375rem] leading-relaxed text-[var(--color-text-secondary)] text-pretty"
			>
				{children}
			</div>
		</section>
	)
}

export function LegalSubheading({ children }: { children: ReactNode }) {
	return (
		<h3 className="pt-2 text-[0.95rem] font-semibold text-[var(--color-text)]">
			{children}
		</h3>
	)
}

export function LegalList({ children }: { children: ReactNode }) {
	return (
		<ul data-legal-list className="grid gap-2 pt-1">
			{children}
		</ul>
	)
}

export function LegalListItem({ children }: { children: ReactNode }) {
	return (
		<li
			data-legal-item
			className="relative pl-4 text-[0.9375rem] leading-relaxed text-[var(--color-text-secondary)] before:absolute before:left-0 before:top-[0.65em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--color-signal)] before:opacity-70"
		>
			{children}
		</li>
	)
}

export function LegalDocument({
	title,
	description,
	updated,
	toc,
	related,
	children,
}: LegalDocumentProps) {
	const pageRef = useRef<HTMLDivElement>(null)
	const [activeId, setActiveId] = useState(toc[0]?.id ?? "")

	useGSAP(
		() => {
			const root = pageRef.current
			if (!root) return

			const reduce = prefersReducedMotion()
			const introBits = root.querySelectorAll("[data-legal-intro]")
			const rule = root.querySelector<HTMLElement>("[data-legal-rule]")
			const tocLinks = root.querySelectorAll("[data-legal-toc]")
			const sections = gsap.utils.toArray<HTMLElement>(
				root.querySelectorAll("[data-legal-section]"),
			)

			if (reduce) {
				gsap.set([introBits, tocLinks, sections], { clearProps: "all" })
				if (rule) gsap.set(rule, { scaleX: 1 })
				return
			}

			const intro = gsap.timeline({ defaults: { ease: "power3.out" } })

			intro.from(introBits, {
				opacity: 0,
				y: 22,
				filter: "blur(6px)",
				duration: 0.55,
				stagger: 0.07,
			})

			if (rule) {
				intro.from(
					rule,
					{
						scaleX: 0,
						duration: 0.7,
						ease: "power3.out",
						transformOrigin: "left center",
					},
					"-=0.35",
				)
			}

			intro.from(
				tocLinks,
				{
					opacity: 0,
					x: -10,
					duration: 0.35,
					stagger: 0.03,
				},
				"-=0.45",
			)

			sections.forEach((section) => {
				const heading = section.querySelector("[data-legal-heading]")
				const body = section.querySelector("[data-legal-body]")
				const items = section.querySelectorAll("[data-legal-item]")

				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: section,
						start: "top 86%",
						toggleActions: "play none none none",
					},
				})

				if (heading) {
					tl.from(heading, {
						opacity: 0,
						y: 18,
						duration: 0.4,
						ease: "power2.out",
					})
				}

				if (body) {
					tl.from(
						body,
						{
							opacity: 0,
							y: 12,
							duration: 0.4,
							ease: "power2.out",
						},
						"-=0.2",
					)
				}

				if (items.length) {
					tl.from(
						items,
						{
							opacity: 0,
							x: -8,
							duration: 0.3,
							stagger: 0.04,
							ease: "power2.out",
						},
						"-=0.15",
					)
				}
			})

			sections.forEach((section) => {
				ScrollTrigger.create({
					trigger: section,
					start: "top 35%",
					end: "bottom 35%",
					onEnter: () => {
						if (section.id) setActiveId(section.id)
					},
					onEnterBack: () => {
						if (section.id) setActiveId(section.id)
					},
				})
			})

			ScrollTrigger.refresh()
		},
		{ scope: pageRef, dependencies: [toc] },
	)

	const scrollToSection = useCallback(
		(event: MouseEvent<HTMLAnchorElement>, id: string) => {
			event.preventDefault()
			const target = pageRef.current?.querySelector<HTMLElement>(`#${id}`)
			if (!target) return

			setActiveId(id)

			const top =
				target.getBoundingClientRect().top + window.scrollY - 96

			if (prefersReducedMotion()) {
				window.scrollTo(0, top)
				return
			}

			gsap.to(window, {
				duration: 0.8,
				scrollTo: { y: top, autoKill: true },
				ease: "power3.inOut",
			})
		},
		[],
	)

	return (
		<div
			ref={pageRef}
			className="min-h-screen bg-[var(--color-ink)] px-6 pb-20 pt-10 md:px-10"
		>
			<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
				<aside className="hidden lg:block">
					<div className="sticky top-24">
						<p
							data-legal-intro
							className="text-xs font-medium text-[var(--color-text-muted)]"
						>
							On this page
						</p>
						<nav aria-label="Table of contents" className="mt-4 space-y-1">
							{toc.map((item) => (
								<a
									key={item.id}
									href={`#${item.id}`}
									data-legal-toc
									onClick={(event) => scrollToSection(event, item.id)}
									className={cn(
										"block border-l-2 py-1.5 pl-3 text-sm transition-colors duration-200",
										activeId === item.id
											? "border-[var(--color-signal)] text-[var(--color-text)]"
											: "border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text-secondary)]",
									)}
								>
									{item.label}
								</a>
							))}
						</nav>
					</div>
				</aside>

				<div className="min-w-0">
					<header className="mb-10 max-w-2xl pb-8">
						<p
							data-legal-intro
							className="text-xs font-medium text-[var(--color-signal)]"
						>
							Legal
						</p>
						<h1
							data-legal-intro
							className="mt-3 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] text-balance md:text-4xl"
						>
							{title}
						</h1>
						<p
							data-legal-intro
							className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] text-pretty"
						>
							{description}
						</p>
						<p
							data-legal-intro
							className="mt-4 font-mono text-xs text-[var(--color-text-muted)]"
						>
							Last updated {updated}
						</p>
						<div
							data-legal-rule
							className="mt-8 h-px origin-left bg-[var(--color-border)]"
						/>
					</header>

					<nav
						data-legal-intro
						aria-label="Section jump links"
						className="mb-10 flex gap-2 overflow-x-auto pb-1 lg:hidden"
					>
						{toc.map((item) => (
							<a
								key={item.id}
								href={`#${item.id}`}
								onClick={(event) => scrollToSection(event, item.id)}
								className="shrink-0 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text)]"
							>
								{item.label}
							</a>
						))}
					</nav>

					<article className="max-w-[68ch] space-y-10">{children}</article>

					<footer className="mt-16 flex flex-col gap-4 border-t border-[var(--color-border)] pt-8 sm:flex-row sm:items-center sm:justify-between">
						<Link
							href="/"
							className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
						>
							← Home
						</Link>
						<Link
							href={related.href}
							className="text-sm font-medium text-[var(--color-signal)] transition-colors hover:text-[#ff6b5a]"
						>
							{related.label} →
						</Link>
					</footer>
				</div>
			</div>
		</div>
	)
}
