"use client"

import { Bell } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

function notificationCopy(type: string, actorName: string, movieTitle?: string | null) {
	const film = movieTitle ? ` on ${movieTitle}` : ""
	switch (type) {
		case "review_agree":
			return `${actorName} agreed with your review${film}`
		case "review_disagree":
			return `${actorName} disagreed with your review${film}`
		case "review_comment":
			return `${actorName} commented on your review${film}`
		case "review_quote":
			return `${actorName} quoted your review${film}`
		default:
			return `${actorName} interacted with your review`
	}
}

export function NotificationBell() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement>(null)

	const { data: summary } = trpc.friends.getNotifications.useQuery(undefined, {
		refetchInterval: 8000,
		refetchOnWindowFocus: true,
	})

	const { data: engagement, refetch: refetchEngagement } =
		trpc.reviews.listNotifications.useQuery({ limit: 12 }, { enabled: open })

	const markRead = trpc.reviews.markNotificationsRead.useMutation({
		onSuccess: async () => {
			await refetchEngagement()
		},
	})

	const utils = trpc.useUtils()
	const totalCount = summary?.count ?? 0

	useEffect(() => {
		if (!open) return
		const onPointer = (event: MouseEvent) => {
			if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
		}
		document.addEventListener("mousedown", onPointer)
		return () => document.removeEventListener("mousedown", onPointer)
	}, [open])

	useEffect(() => {
		if (open && (summary?.engagementCount ?? 0) > 0) {
			markRead.mutate({})
			void utils.friends.getNotifications.invalidate()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mark all unread when panel opens
	}, [open])

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				aria-label={
					totalCount > 0
						? `${totalCount} notification${totalCount === 1 ? "" : "s"}`
						: "Notifications"
				}
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
				className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)]"
			>
				<Bell className="h-4 w-4" />
				{totalCount > 0 ? (
					<span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-md bg-[var(--color-signal)] px-1 text-[10px] font-semibold text-[var(--color-ink)]">
						{totalCount > 99 ? "99+" : totalCount}
					</span>
				) : null}
			</button>

			{open ? (
				<div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
					<div className="border-b border-[var(--color-border)] px-4 py-3">
						<p className="text-sm font-semibold text-[var(--color-text)]">Notifications</p>
					</div>

					<div className="max-h-80 overflow-y-auto">
						{(summary?.requestCount ?? 0) > 0 ? (
							<button
								type="button"
								onClick={() => {
									setOpen(false)
									router.push("/friends?tab=requests")
								}}
								className="flex w-full items-start gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
							>
								<span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-signal-muted)] text-xs font-bold text-[var(--color-signal)]">
									{summary?.requestCount}
								</span>
								<span>
									<span className="block text-sm text-[var(--color-text)]">
										Friend request{(summary?.requestCount ?? 0) === 1 ? "" : "s"}
									</span>
									<span className="text-xs text-[var(--color-text-muted)]">
										Open the Friends tab to respond
									</span>
								</span>
							</button>
						) : null}

						{(engagement?.items ?? []).length === 0 && (summary?.requestCount ?? 0) === 0 ? (
							<p className="px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
								You&apos;re all caught up
							</p>
						) : null}

						{(engagement?.items ?? []).map((item) => {
							const href =
								item.movieId && item.ratingId
									? `/movie/${item.movieId}#review-${item.ratingId}`
									: item.movieId
										? `/movie/${item.movieId}`
										: "/friends"

							return (
								<Link
									key={item.id}
									href={href}
									onClick={() => setOpen(false)}
									className={cn(
										"flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]",
										!item.readAt && "bg-[var(--color-signal-muted)]/30",
									)}
								>
									{item.actor.image ? (
										<span className="relative mt-0.5 h-8 w-8 flex-none overflow-hidden rounded-full">
											<Image
												src={item.actor.image}
												alt=""
												fill
												unoptimized
												sizes="32px"
												className="object-cover"
											/>
										</span>
									) : (
										<span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)]">
											{item.actor.name.slice(0, 1)}
										</span>
									)}
									<span className="min-w-0 text-sm text-[var(--color-text-secondary)]">
										{notificationCopy(item.type, item.actor.name, item.movieTitle)}
									</span>
								</Link>
							)
						})}
					</div>
				</div>
			) : null}
		</div>
	)
}
