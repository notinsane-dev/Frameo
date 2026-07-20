"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { Ban, Copy, ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useAuth } from "@/hooks/useAuth"
import { tmdb } from "@/lib/tmdb/client"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { moodLabel, WATCH_TOGETHER_MOODS } from "@/lib/watch-together/moods"

gsap.registerPlugin(useGSAP)

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

const fieldClass =
	"w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-text-muted)]"

const btnPrimary =
	"inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:cursor-not-allowed disabled:opacity-40"

const btnSecondary =
	"inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"

export default function WatchTogetherPage() {
	const { showToast } = useToastContext()
	const { user } = useAuth()
	const [mood, setMood] = useState("cozy")
	const [customMood, setCustomMood] = useState("")
	const [promptMood, setPromptMood] = useState("")
	const [promptCustom, setPromptCustom] = useState("")
	const [joinCode, setJoinCode] = useState("")
	const [sessionId, setSessionId] = useState<number | null>(null)
	const [selectedFriends, setSelectedFriends] = useState<string[]>([])

	const pageRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const shortlistRef = useRef<HTMLElement>(null)

	const { data: friends } = trpc.friends.getFriends.useQuery()

	const sessionQuery = trpc.watchTogether.get.useQuery(
		{ sessionId: sessionId! },
		{
			enabled: Boolean(sessionId),
			refetchInterval: (query) => (query.state.data?.status === "closed" ? false : 4000),
		},
	)

	const create = trpc.watchTogether.create.useMutation({
		onSuccess: (result) => {
			setSessionId(result.sessionId)
			showToast(`Session ${result.code} created`, "success")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const join = trpc.watchTogether.join.useMutation({
		onSuccess: (result) => {
			setSessionId(result.sessionId)
			showToast("Joined session", "success")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const generate = trpc.watchTogether.generateShortlist.useMutation({
		onSuccess: async () => {
			await sessionQuery.refetch()
			showToast("Shortlist ready", "success")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const veto = trpc.watchTogether.veto.useMutation({
		onSuccess: async () => {
			await sessionQuery.refetch()
		},
		onError: (error) => showToast(error.message, "error"),
	})

	const close = trpc.watchTogether.close.useMutation({
		onSuccess: async () => {
			await sessionQuery.refetch()
			showToast("Session closed", "info")
		},
	})

	const setMemberMood = trpc.watchTogether.setMood.useMutation({
		onSuccess: async () => {
			await sessionQuery.refetch()
			setPromptCustom("")
			setPromptMood("")
			showToast("Mood saved", "success")
		},
		onError: (error) => showToast(error.message, "error"),
	})

	useGSAP(
		() => {
			if (!contentRef.current || prefersReducedMotion()) return
			gsap.fromTo(
				contentRef.current,
				{ opacity: 0, y: 12 },
				{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
			)
		},
		{ dependencies: [sessionId, sessionQuery.data?.id], scope: pageRef },
	)

	const shortlistLength = sessionQuery.data?.shortlist.length ?? 0

	useEffect(() => {
		const root = shortlistRef.current
		if (!root || prefersReducedMotion() || shortlistLength === 0) return

		const items = root.querySelectorAll("[data-shortlist-item]")
		gsap.fromTo(
			items,
			{ opacity: 0, y: 16 },
			{
				opacity: 1,
				y: 0,
				duration: 0.4,
				stagger: 0.07,
				ease: "power2.out",
				overwrite: "auto",
			},
		)
	}, [shortlistLength, sessionQuery.data?.id])

	const toggleFriend = (id: string) => {
		setSelectedFriends((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 8),
		)
	}

	const leaveSession = () => {
		setSessionId(null)
		setSelectedFriends([])
		setJoinCode("")
		setPromptMood("")
		setPromptCustom("")
	}

	const copyCode = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code)
			showToast("Code copied", "success")
		} catch {
			showToast("Couldn’t copy code", "error")
		}
	}

	const resolvedHostMood = (customMood.trim() || mood).trim()
	const resolvedPromptMood = (promptCustom.trim() || promptMood).trim()

	const session = sessionQuery.data
	const isClosed = session?.status === "closed"
	const isActive = Boolean(session) && !isClosed

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10"
			>
				<div ref={contentRef} className="mx-auto max-w-5xl">
					<header className="mb-10 max-w-xl">
						<h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
							Watch together
						</h1>
						<p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
							Create a session, share the code, set moods, then shortlist and veto.
						</p>
					</header>

					{!sessionId ? (
						<div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
							<section className="space-y-6">
								<div>
									<h2 className="text-sm font-semibold text-[var(--color-text)]">
										Create session
									</h2>
									<p className="mt-1 text-sm text-[var(--color-text-muted)]">
										You’re the host. Friends join with the code.
									</p>
								</div>

								<div className="space-y-2">
									<label
										htmlFor="host-mood-preset"
										className="block text-sm text-[var(--color-text-secondary)]"
									>
										Mood
									</label>
									<select
										id="host-mood-preset"
										value={customMood.trim() ? "" : mood}
										disabled={Boolean(customMood.trim())}
										onChange={(event) => {
											setMood(event.target.value)
											setCustomMood("")
										}}
										className={cn(fieldClass, "disabled:opacity-50")}
									>
										{WATCH_TOGETHER_MOODS.map((item) => (
											<option key={item.id} value={item.id}>
												{item.label}
											</option>
										))}
									</select>
									<input
										value={customMood}
										onChange={(event) => {
											const next = event.target.value.slice(0, 40)
											setCustomMood(next)
											if (!next.trim()) setMood("cozy")
										}}
										placeholder="Or describe your own mood"
										maxLength={40}
										className={fieldClass}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-baseline justify-between gap-3">
										<p className="text-sm text-[var(--color-text-secondary)]">
											Invite friends
										</p>
										<span className="font-mono text-xs text-[var(--color-text-muted)]">
											{selectedFriends.length}/8
										</span>
									</div>
									{(friends ?? []).length === 0 ? (
										<p className="rounded-lg border border-[var(--color-border)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
											No friends yet. You can still create a code and share it.
										</p>
									) : (
										<ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-[var(--color-border)] p-1">
											{(friends ?? []).map((friend) => {
												const active = selectedFriends.includes(friend.id)
												return (
													<li key={friend.id}>
														<label
															className={cn(
																"flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
																active
																	? "bg-[var(--color-signal-muted)] text-[var(--color-text)]"
																	: "text-[var(--color-text-secondary)] hover:bg-white/[0.03] hover:text-[var(--color-text)]",
															)}
														>
															<input
																type="checkbox"
																checked={active}
																onChange={() => toggleFriend(friend.id)}
																className="h-3.5 w-3.5 accent-[var(--color-signal)]"
															/>
															<span>{friend.name}</span>
														</label>
													</li>
												)
											})}
										</ul>
									)}
								</div>

								<button
									type="button"
									disabled={create.isPending || !resolvedHostMood}
									onClick={() =>
										create.mutate({
											mood: resolvedHostMood,
											friendIds: selectedFriends,
										})
									}
									className={cn(btnPrimary, "w-full sm:w-auto")}
								>
									{create.isPending ? (
										<>
											<LoadingSpinner size="sm" />
											Creating…
										</>
									) : (
										"Create session"
									)}
								</button>
							</section>

							<section className="space-y-6 border-t border-[var(--color-border)] pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
								<div>
									<h2 className="text-sm font-semibold text-[var(--color-text)]">
										Join session
									</h2>
									<p className="mt-1 text-sm text-[var(--color-text-muted)]">
										Enter the code from your host.
									</p>
								</div>
								<div className="space-y-2">
									<label
										htmlFor="join-code"
										className="block text-sm text-[var(--color-text-secondary)]"
									>
										Session code
									</label>
									<input
										id="join-code"
										value={joinCode}
										onChange={(event) =>
											setJoinCode(event.target.value.toUpperCase())
										}
										placeholder="ABC123"
										maxLength={8}
										autoComplete="off"
										className={cn(
											fieldClass,
											"font-mono text-lg tracking-[0.2em] uppercase",
										)}
									/>
								</div>
								<button
									type="button"
									disabled={join.isPending || joinCode.length < 4}
									onClick={() => join.mutate({ code: joinCode })}
									className={cn(btnSecondary, "w-full sm:w-auto")}
								>
									{join.isPending ? (
										<>
											<LoadingSpinner size="sm" />
											Joining…
										</>
									) : (
										"Join"
									)}
								</button>
							</section>
						</div>
					) : null}

					{sessionId && sessionQuery.isLoading ? (
						<div className="flex justify-center py-20">
							<LoadingSpinner />
						</div>
					) : null}

					{session ? (
						<div className="space-y-10">
							{isClosed ? (
								<section className="max-w-lg space-y-4">
									<p className="text-sm text-[var(--color-text-muted)]">Session ended</p>
									<p className="font-mono text-3xl tracking-widest text-[var(--color-text)]">
										{session.code}
									</p>
									<p className="text-sm text-[var(--color-text-secondary)]">
										{session.mood ? `Moods: ${session.mood}` : "No moods recorded"}
									</p>
									<button type="button" onClick={leaveSession} className={btnPrimary}>
										New session
									</button>
								</section>
							) : (
								<section className="space-y-8">
									<div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
										<div>
											<div className="flex items-center gap-2">
												<p className="font-mono text-2xl tracking-[0.2em] text-[var(--color-text)] md:text-3xl">
													{session.code}
												</p>
												<button
													type="button"
													onClick={() => copyCode(session.code)}
													aria-label="Copy session code"
													className="rounded-md border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
												>
													<Copy className="h-3.5 w-3.5" />
												</button>
											</div>
											<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
												<span className="capitalize">{session.status}</span>
												{session.mood ? ` · ${session.mood}` : null}
											</p>
										</div>

										{session.isHost ? (
											<div className="flex flex-wrap gap-2">
												<button
													type="button"
													disabled={generate.isPending || !session.myMood}
													onClick={() =>
														generate.mutate({ sessionId: session.id, limit: 5 })
													}
													className={btnPrimary}
												>
													{generate.isPending ? (
														<>
															<LoadingSpinner size="sm" />
															Generating…
														</>
													) : (
														"Generate shortlist"
													)}
												</button>
												<button
													type="button"
													disabled={close.isPending}
													onClick={() => close.mutate({ sessionId: session.id })}
													className={btnSecondary}
												>
													End session
												</button>
											</div>
										) : null}
									</div>

									{isActive && !session.myMood ? (
										<div className="max-w-md space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-5">
											<div>
												<h2 className="text-sm font-semibold text-[var(--color-text)]">
													Set your mood
												</h2>
												<p className="mt-1 text-sm text-[var(--color-text-muted)]">
													Required before the host generates picks.
												</p>
											</div>
											<select
												value={promptCustom.trim() ? "" : promptMood}
												disabled={Boolean(promptCustom.trim())}
												onChange={(event) => {
													setPromptMood(event.target.value)
													setPromptCustom("")
												}}
												className={cn(fieldClass, "disabled:opacity-50")}
											>
												<option value="">Select a mood</option>
												{WATCH_TOGETHER_MOODS.map((item) => (
													<option key={item.id} value={item.id}>
														{item.label}
													</option>
												))}
											</select>
											<input
												value={promptCustom}
												onChange={(event) =>
													setPromptCustom(event.target.value.slice(0, 40))
												}
												placeholder="Or write your own"
												maxLength={40}
												className={fieldClass}
											/>
											<button
												type="button"
												disabled={setMemberMood.isPending || !resolvedPromptMood}
												onClick={() =>
													setMemberMood.mutate({
														sessionId: session.id,
														mood: resolvedPromptMood,
													})
												}
												className={btnPrimary}
											>
												{setMemberMood.isPending ? "Saving…" : "Save mood"}
											</button>
										</div>
									) : null}

									{isActive && session.myMood ? (
										<p className="text-sm text-[var(--color-text-secondary)]">
											Your mood:{" "}
											<span className="text-[var(--color-text)]">
												{moodLabel(session.myMood)}
											</span>
											{session.pendingMoods.length > 0 ? (
												<span className="text-[var(--color-text-muted)]">
													{" "}
													· Waiting on {session.pendingMoods.join(", ")}
												</span>
											) : null}
										</p>
									) : null}

									<div>
										<h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">
											Members
										</h2>
										<div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
											<table className="w-full text-left text-sm">
												<thead className="border-b border-[var(--color-border)] bg-[var(--color-ink-elevated)] text-[var(--color-text-muted)]">
													<tr>
														<th className="px-4 py-2.5 font-medium">Name</th>
														<th className="px-4 py-2.5 font-medium">Mood</th>
														<th className="px-4 py-2.5 font-medium">Vetoes</th>
													</tr>
												</thead>
												<tbody>
													{session.members.map((member) => (
														<tr
															key={member.userId}
															className="border-b border-[var(--color-border)] last:border-b-0"
														>
															<td className="px-4 py-3 text-[var(--color-text)]">
																{member.name}
															</td>
															<td className="px-4 py-3 text-[var(--color-text-secondary)]">
																{moodLabel(member.mood) ?? "—"}
															</td>
															<td className="px-4 py-3 font-mono text-[var(--color-text-muted)]">
																{member.vetoesRemaining}
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									</div>
								</section>
							)}

							{session.shortlist.length > 0 ? (
								<section ref={shortlistRef}>
									<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
										<div>
											<h2 className="font-heading text-xl font-bold tracking-tight text-[var(--color-text)]">
												{isClosed ? "Final shortlist" : "Shortlist"}
											</h2>
											<p className="mt-1 text-sm text-[var(--color-text-muted)]">
												{session.shortlist.length} pick
												{session.shortlist.length === 1 ? "" : "s"} ranked by group
												fit
												{isActive ? " · veto what you won’t watch" : null}
											</p>
										</div>
										{isActive && user?.id ? (
											<p className="font-mono text-xs text-[var(--color-text-muted)]">
												Your vetoes left:{" "}
												<span className="text-[var(--color-text)]">
													{session.members.find((m) => m.userId === user.id)
														?.vetoesRemaining ?? "—"}
												</span>
											</p>
										) : null}
									</div>

									<ol className="space-y-3">
										{session.shortlist.map((item, index) => {
											const fit = Math.round(item.score * 100)
											const isTop = index === 0

											return (
												<li
													key={item.tmdbId}
													data-shortlist-item
													className={cn(
														"group relative overflow-hidden rounded-xl border transition-colors",
														isTop
															? "border-[var(--color-signal-border)] bg-[var(--color-ink-elevated)]"
															: "border-[var(--color-border)] bg-[var(--color-ink-elevated)] hover:border-[var(--color-border-hover)]",
													)}
												>
													{isTop ? (
														<div
															aria-hidden
															className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-signal)]/50 to-transparent"
														/>
													) : null}

													<div
														className={cn(
															"flex gap-4 p-4 sm:gap-5",
															isTop ? "sm:p-5" : "",
														)}
													>
														<div className="relative flex-none">
															<div
																className={cn(
																	"relative overflow-hidden rounded-lg bg-[var(--color-surface)]",
																	isTop
																		? "h-[140px] w-[94px] sm:h-[160px] sm:w-[108px]"
																		: "h-[112px] w-[76px]",
																)}
															>
																{item.posterPath ? (
																	<Image
																		src={tmdb.getImageUrl(
																			item.posterPath,
																			"w500",
																		)}
																		alt=""
																		fill
																		unoptimized
																		sizes={isTop ? "108px" : "76px"}
																		className="object-cover"
																	/>
																) : null}
															</div>
															<span
																className={cn(
																	"absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold",
																	isTop
																		? "bg-[var(--color-signal)] text-[var(--color-ink)]"
																		: "border border-[var(--color-border)] bg-[var(--color-ink)] text-[var(--color-text-secondary)]",
																)}
															>
																{index + 1}
															</span>
														</div>

														<div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
															<div>
																{isTop ? (
																	<p className="mb-1 text-xs font-medium text-[var(--color-signal)]">
																		Top pick
																	</p>
																) : null}
																<div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
																	<Link
																		href={`/movie/${item.tmdbId}`}
																		className={cn(
																			"font-heading font-semibold tracking-tight text-[var(--color-text)] transition-colors hover:text-[var(--color-signal)]",
																			isTop
																				? "text-xl sm:text-2xl"
																				: "text-lg",
																		)}
																	>
																		{item.title}
																	</Link>
																	<div className="min-w-[7.5rem]">
																		<div className="flex items-baseline justify-between gap-2">
																			<span className="text-xs text-[var(--color-text-muted)]">
																				Group fit
																			</span>
																			<span className="font-mono text-sm font-semibold text-[var(--color-text)]">
																				{fit}%
																			</span>
																		</div>
																		<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-border)]">
																			<div
																				className="h-full rounded-full bg-[var(--color-signal)]"
																				style={{
																					width: `${Math.min(100, Math.max(8, fit))}%`,
																				}}
																			/>
																		</div>
																	</div>
																</div>
																<p
																	className={cn(
																		"mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]",
																		isTop
																			? "line-clamp-3 max-w-2xl"
																			: "line-clamp-2 max-w-xl",
																	)}
																>
																	{item.reason}
																</p>
															</div>

															<div className="flex flex-wrap items-center gap-2">
																<Link
																	href={`/movie/${item.tmdbId}`}
																	className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
																>
																	View film
																	<ExternalLink className="h-3 w-3" />
																</Link>
																{isActive ? (
																	<button
																		type="button"
																		disabled={veto.isPending}
																		onClick={() =>
																			veto.mutate({
																				sessionId: session.id,
																				movieId: item.tmdbId,
																			})
																		}
																		className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/25 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:border-red-400/50 hover:bg-red-500/10 disabled:opacity-40"
																	>
																		<Ban className="h-3 w-3" />
																		Veto
																	</button>
																) : null}
															</div>
														</div>
													</div>
												</li>
											)
										})}
									</ol>
								</section>
							) : null}

							{isActive && session.shortlist.length === 0 ? (
								<p className="text-sm text-[var(--color-text-muted)]">
									{session.isHost
										? "Generate a shortlist once moods are in."
										: "Waiting for the host to generate the shortlist."}
								</p>
							) : null}

							{isClosed && session.shortlist.length === 0 ? (
								<p className="text-sm text-[var(--color-text-muted)]">
									No picks were finalized for this session.
								</p>
							) : null}
						</div>
					) : null}
				</div>
			</div>
		</AuthGuard>
	)
}
