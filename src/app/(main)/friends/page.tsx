"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"

import { ActivityTab } from "@/components/friends/ActivityTab"
import { FindPeopleTab } from "@/components/friends/FindPeopleTab"
import { FriendsTab } from "@/components/friends/FriendsTab"
import { RequestsTab } from "@/components/friends/RequestsTab"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { useFriends } from "@/hooks/useFriends"
import { cn } from "@/lib/utils"

gsap.registerPlugin(useGSAP)

const tabs = [
	{ id: "friends", label: "Friends" },
	{ id: "requests", label: "Requests" },
	{ id: "activity", label: "Activity" },
	{ id: "find", label: "Find people" },
] as const

function prefersReducedMotion() {
	if (typeof window === "undefined") return false
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export default function FriendsPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const activeTab = (searchParams.get("tab") ?? "friends") as (typeof tabs)[number]["id"]
	const {
		friends,
		friendRequests,
		sentRequests,
		removeFriend,
		acceptRequest,
		rejectRequest,
		cancelSentRequest,
	} = useFriends()

	const pageRef = useRef<HTMLDivElement>(null)
	const panelRef = useRef<HTMLDivElement>(null)

	useGSAP(
		() => {
			if (!panelRef.current || prefersReducedMotion()) return
			gsap.fromTo(
				panelRef.current,
				{ opacity: 0, y: 10 },
				{ opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
			)
		},
		{ dependencies: [activeTab], scope: pageRef },
	)

	const requestCount = friendRequests.length

	return (
		<AuthGuard>
			<div
				ref={pageRef}
				className="min-h-screen bg-[var(--color-ink)] px-6 pb-16 pt-10 md:px-10"
			>
				<div className="mx-auto max-w-5xl">
					<header className="mb-8 max-w-xl">
						<h1 className="font-heading text-3xl font-bold tracking-tight text-[var(--color-text)] md:text-4xl">
							Friends
						</h1>
						<p className="mt-2 text-sm text-[var(--color-text-secondary)]">
							{friends.length} connection{friends.length === 1 ? "" : "s"}
							{requestCount > 0
								? ` · ${requestCount} pending request${requestCount === 1 ? "" : "s"}`
								: ""}
						</p>
					</header>

					<nav
						className="mb-8 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]"
						aria-label="Friends sections"
					>
						{tabs.map((tab) => {
							const active = activeTab === tab.id
							const badge =
								tab.id === "requests" && requestCount > 0 ? requestCount : null
							return (
								<button
									key={tab.id}
									type="button"
									onClick={() => router.push(`/friends?tab=${tab.id}`)}
									className={cn(
										"relative shrink-0 px-4 py-3 text-sm font-medium transition-colors",
										active
											? "text-[var(--color-text)]"
											: "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
									)}
								>
									<span className="inline-flex items-center gap-2">
										{tab.label}
										{badge ? (
											<span className="font-mono text-xs text-[var(--color-signal)]">
												{badge}
											</span>
										) : null}
									</span>
									{active ? (
										<span className="absolute inset-x-4 bottom-0 h-0.5 bg-[var(--color-signal)]" />
									) : null}
								</button>
							)
						})}
					</nav>

					<div ref={panelRef}>
						{activeTab === "friends" ? (
							<FriendsTab
								friends={friends}
								onRemoveFriend={removeFriend}
								onOpenFindPeople={() => router.push("/friends?tab=find")}
							/>
						) : null}

						{activeTab === "requests" ? (
							<RequestsTab
								requests={friendRequests}
								sentRequests={sentRequests}
								onAccept={acceptRequest}
								onReject={rejectRequest}
								onCancelSent={cancelSentRequest}
							/>
						) : null}

						{activeTab === "activity" ? <ActivityTab /> : null}
						{activeTab === "find" ? <FindPeopleTab /> : null}
					</div>
				</div>
			</div>
		</AuthGuard>
	)
}
