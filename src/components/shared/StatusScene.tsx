"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"
import { useRef, type ReactNode } from "react"

import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export type StatusAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary"
}

type StatusSceneProps = {
  code: string
  eyebrow: string
  title: string
  description: string
  detail?: ReactNode
  actions: StatusAction[]
}

export function StatusScene({
  code,
  eyebrow,
  title,
  description,
  detail,
  actions,
}: StatusSceneProps) {
  const rootRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || prefersReducedMotion()) return

      const atmosphere = root.querySelectorAll("[data-status-atmosphere]")
      const bits = root.querySelectorAll("[data-status-bit]")
      const codeEl = root.querySelector("[data-status-code]")
      const rule = root.querySelector("[data-status-rule]")

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

      tl.from(atmosphere, {
        opacity: 0,
        duration: 0.8,
        stagger: 0.06,
      })

      if (codeEl) {
        tl.from(
          codeEl,
          {
            opacity: 0,
            y: 36,
            filter: "blur(12px)",
            duration: 0.7,
          },
          "-=0.45",
        )
      }

      if (rule) {
        tl.fromTo(
          rule,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.55, ease: "power3.inOut" },
          "-=0.25",
        )
      }

      tl.from(
        bits,
        {
          opacity: 0,
          y: 20,
          filter: "blur(6px)",
          duration: 0.5,
          stagger: 0.07,
        },
        "-=0.3",
      )
    },
    { scope: rootRef },
  )

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--color-ink)] text-[var(--color-text)]"
    >
      {/* Atmosphere — not flat ink */}
      <div
        data-status-atmosphere
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(255,77,61,0.12),transparent_55%)]"
      />
      <div
        data-status-atmosphere
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[var(--color-signal)]/10 blur-3xl"
      />
      <div
        data-status-atmosphere
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-[var(--color-cyan-rim)]/8 blur-3xl"
      />
      <div
        data-status-atmosphere
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(232,234,238,0.9) 2px, rgba(232,234,238,0.9) 3px)",
        }}
      />

      {/* Frame corners */}
      <FrameCorners />

      <header data-status-bit className="relative z-10 px-6 pt-8 md:px-10">
        <Link href="/" aria-label={`${siteConfig.name} home`}>
          <FrameoLogo size="md" />
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-16 text-center md:px-10">
        <p
          data-status-bit
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-text-muted)]"
        >
          {eyebrow}
        </p>

        <h1
          data-status-code
          className="mt-5 font-heading text-[clamp(5.5rem,18vw,9.5rem)] font-bold leading-none tracking-[-0.04em] text-[var(--color-signal)] text-balance"
        >
          {code}
        </h1>

        <div
          data-status-rule
          aria-hidden
          className="mt-6 h-px w-24 origin-center bg-[var(--color-signal)]"
        />

        <h2
          data-status-bit
          className="mt-8 max-w-xl font-heading text-3xl font-semibold tracking-tight text-[var(--color-text)] text-balance md:text-4xl"
        >
          {title}
        </h2>

        <p
          data-status-bit
          className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-secondary)] text-pretty"
        >
          {description}
        </p>

        {detail ? (
          <div
            data-status-bit
            className="mt-6 max-w-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/80 px-4 py-3 font-mono text-xs leading-relaxed text-[var(--color-text-muted)]"
          >
            {detail}
          </div>
        ) : null}

        <div
          data-status-bit
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {actions.map((action) => (
            <StatusActionButton key={action.label} action={action} />
          ))}
        </div>
      </div>

      <footer
        data-status-bit
        className="relative z-10 px-6 pb-8 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] md:px-10"
      >
        {siteConfig.name} · cut short, not over
      </footer>
    </section>
  )
}

function StatusActionButton({ action }: { action: StatusAction }) {
  const className = cn(
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-colors",
    action.variant === "secondary"
      ? "border border-[var(--color-border-hover)] text-[var(--color-text)] hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]"
      : "bg-[var(--color-signal)] text-[var(--color-ink)] hover:bg-[#ff6b5a]",
  )

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  )
}

function FrameCorners() {
  const corner =
    "pointer-events-none absolute h-10 w-10 text-[var(--color-signal)]/35 md:h-14 md:w-14"

  return (
    <>
      <svg
        data-status-atmosphere
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
        className={cn(corner, "left-5 top-5 md:left-8 md:top-8")}
      >
        <path
          d="M4 20V4h16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        data-status-atmosphere
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
        className={cn(corner, "right-5 top-5 md:right-8 md:top-8")}
      >
        <path
          d="M36 4h16v16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        data-status-atmosphere
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
        className={cn(corner, "bottom-5 left-5 md:bottom-8 md:left-8")}
      >
        <path
          d="M4 36v16h16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <svg
        data-status-atmosphere
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
        className={cn(corner, "bottom-5 right-5 md:bottom-8 md:right-8")}
      >
        <path
          d="M52 36v16H36"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </>
  )
}
