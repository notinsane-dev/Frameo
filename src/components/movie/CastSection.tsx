"use client"

import gsap from "gsap"
import { User } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

import { useRevealOnScroll } from "@/hooks/useGSAPAnimations"
import { tmdb } from "@/lib/tmdb/client"
import type { TMDBCastMember } from "@/lib/tmdb/types"

type CastSectionProps = {
	cast: TMDBCastMember[]
}

function googleAboutUrl(name: string) {
	return `https://www.google.com/search?q=${encodeURIComponent(`${name} actor`)}`
}

function CastCard({ member }: { member: TMDBCastMember }) {
	return (
		<a
			href={googleAboutUrl(member.name)}
			target="_blank"
			rel="noopener noreferrer"
			className="w-36 flex-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 transition-colors hover:border-[var(--color-signal-border)] hover:bg-[var(--color-surface)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
			aria-label={`Search Google for ${member.name}`}
		>
			<div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-ink-elevated)]">
				{member.profile_path ? (
					<Image
						src={tmdb.getImageUrl(member.profile_path, "w200")}
						alt={member.name}
						fill
						unoptimized
						sizes="80px"
						className="object-cover"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
						<User className="h-5 w-5" />
					</div>
				)}
			</div>
			<p className="line-clamp-1 text-center text-sm font-medium text-[var(--color-text)]">
				{member.name}
			</p>
			<p className="line-clamp-1 text-center text-xs text-[var(--color-text-secondary)]">
				{member.character}
			</p>
		</a>
	)
}

export function CastSection({ cast }: CastSectionProps) {
	const sectionRef = useRef<HTMLElement>(null)
	const trackRef = useRef<HTMLDivElement>(null)
	const tweenRef = useRef<gsap.core.Tween | null>(null)
	const [reducedMotion, setReducedMotion] = useState(false)
	const members = cast.slice(0, 16)

	useRevealOnScroll(sectionRef)

	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)")
		const sync = () => setReducedMotion(media.matches)
		sync()
		media.addEventListener("change", sync)
		return () => media.removeEventListener("change", sync)
	}, [])

	useEffect(() => {
		const track = trackRef.current
		if (!track || reducedMotion || members.length === 0) return

		const halfWidth = track.scrollWidth / 2
		if (halfWidth <= 0) return

		// ~28px/sec — slow continuous loop
		const duration = Math.max(halfWidth / 28, 20)

		const tween = gsap.fromTo(
			track,
			{ x: 0 },
			{
				x: -halfWidth,
				duration,
				ease: "none",
				repeat: -1,
			},
		)
		tweenRef.current = tween

		return () => {
			tween.kill()
			tweenRef.current = null
		}
	}, [members.length, reducedMotion])

	if (!members.length) return null

	const loop = reducedMotion ? members : [...members, ...members]

	return (
		<section ref={sectionRef} className="overflow-hidden">
			<div className="mb-6">
				<p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-signal)]">
					People
				</p>
				<h2 className="mt-2 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
					Cast
				</h2>
				<p className="mt-1 text-sm text-[var(--color-text-secondary)]">
					Click anyone to look them up
				</p>
			</div>

			<div
				className={
					reducedMotion
						? "flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						: "overflow-hidden"
				}
				onMouseEnter={() => tweenRef.current?.pause()}
				onMouseLeave={() => tweenRef.current?.resume()}
				onFocusCapture={() => tweenRef.current?.pause()}
				onBlurCapture={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
						tweenRef.current?.resume()
					}
				}}
			>
				<div
					ref={trackRef}
					className={`flex w-max gap-4 ${reducedMotion ? "" : "will-change-transform"}`}
				>
					{loop.map((member, index) => (
						<CastCard
							key={`${member.id}-${member.order}-${index}`}
							member={member}
						/>
					))}
				</div>
			</div>
		</section>
	)
}
