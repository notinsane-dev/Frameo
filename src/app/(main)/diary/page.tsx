"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { BookOpen, Pencil, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useToastContext } from "@/components/shared/ToastProvider"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function formatDay(date: Date) {
	return date.toLocaleDateString(undefined, {
		weekday: "long",
		month: "short",
		day: "numeric",
		year: "numeric",
	})
}

function dayKey(value: string | Date) {
	const date = new Date(value)
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export default function DiaryPage() {
	const { showToast } = useToastContext()
	const { data: logs, isLoading } = trpc.diary.list.useQuery({ limit: 50 })
	const utils = trpc.useUtils()
	const [editingId, setEditingId] = useState<number | null>(null)
	const [draft, setDraft] = useState("")

	const pageRef = useRef<HTMLDivElement>(null)
	const brandRef = useRef<HTMLParagraphElement>(null)
	const titleRef = useRef<HTMLHeadingElement>(null)
	const supportRef = useRef<HTMLParagraphElement>(null)
	const listRef = useRef<HTMLDivElement>(null)

	const remove = trpc.diary.remove.useMutation({
		onSuccess: async () => {
			await utils.diary.list.invalidate()
			showToast("Removed from Smart Log", "info")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const updateCapsule = trpc.diary.updateCapsule.useMutation({
		onSuccess: async () => {
			setEditingId(null)
			await utils.diary.list.invalidate()
			showToast("Capsule updated", "success")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const grouped = useMemo(() => {
		if (!logs?.length) return []
		const map = new Map<string, { label: string; items: typeof logs }>()
		for (const log of logs) {
			const key = dayKey(log.watchedAt)
			const existing = map.get(key)
			if (existing) {
				existing.items.push(log)
			} else {
				map.set(key, { label: formatDay(new Date(log.watchedAt)), items: [log] })
			}
		}
		return Array.from(map.entries()).map(([key, value]) => ({ key, ...value }))
	}, [logs])

	useGSAP(
		() => {
			if (prefersReducedMotion()) return
			const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
			tl.fromTo(brandRef.current, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45 })
				.fromTo(titleRef.current, { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.6 }, 0.06)
				.fromTo(
					supportRef.current,
					{ opacity: 0, y: 14 },
					{ opacity: 1, y: 0, duration: 0.45 },
					0.14,
				)
		},
		{ scope: pageRef },
	)

	useGSAP(
		() => {
			if (!listRef.current || isLoading || prefersReducedMotion()) return
			const cards = listRef.current.querySelectorAll("[data-log-card]")
			if (!cards.length) return
			gsap.fromTo(
				cards,
				{ opacity: 0, y: 22, filter: "blur(5px)" },
				{
					opacity: 1,
					y: 0,
					filter: "blur(0px)",
					duration: 0.5,
					stagger: 0.05,
					ease: "expo.out",
				},
			)
		},
		{ dependencies: [isLoading, logs?.length], scope: pageRef },
	)

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="relative min-h-screen overflow-hidden bg-[var(--color-ink)] px-6 pb-20 pt-10 md:px-12"
			>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(ellipse_at_top,rgba(255,77,61,0.12),transparent_62%)]"
				/>

				<section className="relative mx-auto mb-12 max-w-3xl text-center">
					<p
						ref={brandRef}
						className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-signal)]"
					>
						Frameo · Smart Log
					</p>
					<h1
						ref={titleRef}
						className="mt-3 font-heading text-4xl font-bold tracking-tight text-[var(--color-text)] text-balance md:text-5xl"
					>
						Your watch diary
					</h1>
					<p
						ref={supportRef}
						className="mx-auto mt-3 max-w-lg text-base text-[var(--color-text-secondary)]"
					>
						Thin capsules of what you watched — each entry sharpens your taste map.
					</p>
					{logs && logs.length > 0 ? (
						<p className="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
							{logs.length} logged · {grouped.length} day{grouped.length === 1 ? "" : "s"}
						</p>
					) : null}
				</section>

				<div ref={listRef} className="relative mx-auto max-w-3xl space-y-8">
					{isLoading ? (
						<div className="flex justify-center py-20">
							<LoadingSpinner />
						</div>
					) : null}

					{!isLoading && (!logs || logs.length === 0) ? (
						<div className="rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/70 px-6 py-16 text-center">
							<BookOpen className="mx-auto mb-4 h-8 w-8 text-[var(--color-signal)]" />
							<p className="font-heading text-xl font-bold text-[var(--color-text)]">
								No watches yet
							</p>
							<p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
								Open a movie and tap &quot;Log watched&quot; to start your diary.
							</p>
						</div>
					) : null}

					{grouped.map((group) => (
						<section key={group.key} className="space-y-3">
							<div className="flex items-center gap-3 px-1">
								<p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-signal)]">
									{group.label}
								</p>
								<span className="h-px flex-1 bg-[var(--color-border)]" />
								<span className="font-mono text-[11px] text-[var(--color-text-muted)]">
									{group.items.length}
								</span>
							</div>

							<div className="space-y-3">
								{group.items.map((log) => (
									<article
										key={log.id}
										data-log-card
										className="flex gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)]/80 p-4 transition-colors hover:border-[var(--color-signal-border)] md:p-5"
									>
										{log.poster ? (
											<div className="relative h-24 w-16 flex-none overflow-hidden rounded-lg border border-[var(--color-border)]">
												<Image
													src={tmdb.getImageUrl(log.poster, "w200")}
													alt=""
													fill
													unoptimized
													sizes="64px"
													className="object-cover"
												/>
											</div>
										) : (
											<div className="h-24 w-16 flex-none rounded-lg bg-[var(--color-surface)]" />
										)}

										<div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
											<div>
												<Link
													href={`/movie/${log.movieId}`}
													className="font-heading text-xl font-bold tracking-tight text-[var(--color-text)] transition-colors hover:text-[var(--color-signal)]"
												>
													{log.title}
												</Link>
												<p className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
													Watched{" "}
													{new Date(log.watchedAt).toLocaleTimeString(undefined, {
														hour: "numeric",
														minute: "2-digit",
													})}
												</p>

												{editingId === log.id ? (
													<div className="mt-3 space-y-2">
														<textarea
															value={draft}
															onChange={(event) =>
																setDraft(event.target.value.slice(0, 200))
															}
															placeholder="A short capsule — what stuck with you?"
															rows={3}
															className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-ink)]/60 px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-signal-border)] focus:ring-1 focus:ring-[var(--color-signal)]/40"
														/>
														<div className="flex items-center justify-between gap-3">
															<span className="font-mono text-[11px] text-[var(--color-text-muted)]">
																{draft.length}/200
															</span>
															<div className="flex gap-2">
																<button
																	type="button"
																	onClick={() => setEditingId(null)}
																	className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
																>
																	Cancel
																</button>
																<button
																	type="button"
																	disabled={updateCapsule.isPending}
																	onClick={() =>
																		updateCapsule.mutate({
																			movieId: log.movieId,
																			capsuleReview: draft.trim(),
																		})
																	}
																	className="rounded-full bg-[var(--color-signal)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-40"
																>
																	{updateCapsule.isPending ? "Saving…" : "Save"}
																</button>
															</div>
														</div>
													</div>
												) : log.capsuleReview ? (
													<p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
														{log.capsuleReview}
													</p>
												) : (
													<p className="mt-2 text-sm italic text-[var(--color-text-muted)]">
														No capsule yet
													</p>
												)}
											</div>

											{editingId !== log.id ? (
												<div className="flex flex-wrap gap-2">
													<button
														type="button"
														onClick={() => {
															setEditingId(log.id)
															setDraft(log.capsuleReview ?? "")
														}}
														className={cn(
															"inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]",
														)}
													>
														<Pencil className="h-3 w-3" />
														{log.capsuleReview ? "Edit capsule" : "Add capsule"}
													</button>
													<button
														type="button"
														disabled={remove.isPending}
														onClick={() => remove.mutate({ movieId: log.movieId })}
														className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] transition-colors hover:border-red-400/40 hover:text-red-300 disabled:opacity-40"
													>
														<Trash2 className="h-3 w-3" />
														Remove
													</button>
												</div>
											) : null}
										</div>
									</article>
								))}
							</div>
						</section>
					))}
				</div>
			</div>
		</AuthGuard>
	)
}
