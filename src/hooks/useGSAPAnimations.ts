"use client"

import { useEffect, type RefObject } from "react"

import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export function useParallax(ref: RefObject<HTMLElement | null>, speed = 0.5) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

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

    const animation = gsap.fromTo(
      element,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      }
    )

    return () => {
      animation.scrollTrigger?.kill()
      animation.kill()
    }
  }, [ref])
}

export function useCountUp(ref: RefObject<HTMLElement | null>, end: number, duration = 1.5) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

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
