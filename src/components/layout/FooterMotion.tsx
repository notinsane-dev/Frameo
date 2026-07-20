"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef, type ReactNode } from "react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function FooterMotion({ children }: { children: ReactNode }) {
	const footerRef = useRef<HTMLElement>(null)

	useGSAP(
		() => {
			const footer = footerRef.current
			if (!footer || prefersReducedMotion()) return

			const bits = footer.querySelectorAll("[data-footer-bit]")
			gsap.fromTo(
				bits,
				{ opacity: 0, y: 18 },
				{
					opacity: 1,
					y: 0,
					duration: 0.55,
					stagger: 0.05,
					ease: "power2.out",
					scrollTrigger: {
						trigger: footer,
						start: "top 92%",
						toggleActions: "play none none none",
					},
				},
			)

			const line = footer.querySelector<HTMLElement>("[data-footer-line]")
			if (!line) return

			gsap.fromTo(
				line,
				{ scaleX: 0 },
				{
					scaleX: 1,
					duration: 0.75,
					ease: "power3.out",
					transformOrigin: "left center",
					scrollTrigger: {
						trigger: footer,
						start: "top 92%",
						toggleActions: "play none none none",
					},
				},
			)
		},
		{ scope: footerRef },
	)

	return (
		<footer
			ref={footerRef}
			className="relative mt-8 border-t border-[var(--color-border)] bg-[var(--color-ink)]"
		>
			{children}
		</footer>
	)
}
