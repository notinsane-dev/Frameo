"use client"

import { useEffect, type RefObject } from "react"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useParallax(ref: RefObject<HTMLElement | null>, speed = 0.5) {
	useEffect(() => {
		const element = ref.current
		if (!element) return

		if (prefersReducedMotion()) return

		const animation = gsap.to(element, {
			yPercent: -20 * speed,
			ease: "none",
			scrollTrigger: {
				trigger: element,
				start: "top bottom",
				end: "bottom top",
				scrub: true,
			},
		})

		return () => {
			animation.scrollTrigger?.kill()
			animation.kill()
		}
	}, [ref, speed])
}

export function useRevealOnScroll(ref: RefObject<HTMLElement | null>) {
	useEffect(() => {
		const element = ref.current
		if (!element) return

		if (prefersReducedMotion()) {
			gsap.set(element, { opacity: 1, y: 0, filter: "none", clipPath: "none" })
			return
		}

		const animation = gsap.fromTo(
			element,
			{ opacity: 0, y: 36, filter: "blur(8px)" },
			{
				opacity: 1,
				y: 0,
				filter: "blur(0px)",
				duration: 0.9,
				ease: "expo.out",
				scrollTrigger: {
					trigger: element,
					start: "top 88%",
					toggleActions: "play none none none",
				},
			},
		)

		return () => {
			animation.scrollTrigger?.kill()
			animation.kill()
		}
	}, [ref])
}

export function useHorizontalRailScrub(
	sectionRef: RefObject<HTMLElement | null>,
	trackRef: RefObject<HTMLElement | null>,
) {
	useEffect(() => {
		const section = sectionRef.current
		const track = trackRef.current
		if (!section || !track) return

		if (prefersReducedMotion()) return

		const getScrollAmount = () => {
			const overflow = track.scrollWidth - section.clientWidth
			return Math.max(0, overflow)
		}

		const tween = gsap.to(track, {
			x: () => -getScrollAmount(),
			ease: "none",
			scrollTrigger: {
				trigger: section,
				start: "top 70%",
				end: () => `+=${Math.max(getScrollAmount(), 200)}`,
				scrub: 0.85,
				invalidateOnRefresh: true,
			},
		})

		const onResize = () => ScrollTrigger.refresh()
		window.addEventListener("resize", onResize)

		return () => {
			window.removeEventListener("resize", onResize)
			tween.scrollTrigger?.kill()
			tween.kill()
		}
	}, [sectionRef, trackRef])
}

export function useCountUp(ref: RefObject<HTMLElement | null>, end: number, duration = 1.5) {
	useEffect(() => {
		const element = ref.current
		if (!element) return

		if (prefersReducedMotion()) {
			element.textContent = Math.round(end).toString()
			return
		}

		const state = { val: 0 }
		const animation = gsap.to(state, {
			val: end,
			duration,
			ease: "power2.out",
			onUpdate: () => {
				if (ref.current) {
					ref.current.textContent = Math.round(state.val).toString()
				}
			},
		})

		return () => {
			animation.kill()
		}
	}, [ref, end, duration])
}
