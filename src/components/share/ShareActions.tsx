"use client"

import { Link2, Share2, UserPlus } from "lucide-react"
import { useState } from "react"

import { useToastContext } from "@/components/shared/ToastProvider"
import { inviteUrl, profileUrl } from "@/lib/share/links"
import { cn } from "@/lib/utils"

type ShareActionsProps = {
	userId: string
	username?: string | null
	name?: string | null
	className?: string
	compact?: boolean
}

async function copyText(value: string) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(value)
		return
	}
	const input = document.createElement("textarea")
	input.value = value
	input.setAttribute("readonly", "")
	input.style.position = "fixed"
	input.style.opacity = "0"
	document.body.appendChild(input)
	input.select()
	document.execCommand("copy")
	document.body.removeChild(input)
}

export function ShareActions({
	userId,
	username,
	name,
	className,
	compact = false,
}: ShareActionsProps) {
	const { showToast } = useToastContext()
	const [busy, setBusy] = useState<"profile" | "invite" | null>(null)

	const profileLink = profileUrl(userId)
	const inviteLink = username ? inviteUrl(username) : null

	const shareOrCopy = async (
		kind: "profile" | "invite",
		url: string,
		title: string,
		text: string,
	) => {
		setBusy(kind)
		try {
			if (typeof navigator !== "undefined" && navigator.share) {
				await navigator.share({ title, text, url })
				showToast(kind === "invite" ? "Invite shared" : "Profile shared", "success")
			} else {
				await copyText(url)
				showToast(
					kind === "invite" ? "Invite link copied" : "Profile link copied",
					"success",
				)
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "AbortError") return
			try {
				await copyText(url)
				showToast(
					kind === "invite" ? "Invite link copied" : "Profile link copied",
					"success",
				)
			} catch {
				showToast("Couldn't share link", "error")
			}
		} finally {
			setBusy(null)
		}
	}

	const buttonClass = compact
		? "inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)] disabled:opacity-50"
		: "inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text)] disabled:opacity-50"

	return (
		<div className={cn("flex flex-wrap items-center gap-2", className)}>
			<button
				type="button"
				disabled={busy !== null}
				onClick={() =>
					void shareOrCopy(
						"profile",
						profileLink,
						name || "Frameo profile",
						`Check out ${name || "this"} profile on Frameo`,
					)
				}
				className={buttonClass}
			>
				{busy === "profile" ? (
					<Link2 className="h-3.5 w-3.5 animate-pulse" />
				) : (
					<Share2 className="h-3.5 w-3.5" />
				)}
				Share profile
			</button>

			{inviteLink ? (
				<button
					type="button"
					disabled={busy !== null}
					onClick={() =>
						void shareOrCopy(
							"invite",
							inviteLink,
							"Join me on Frameo",
							`${name || "A friend"} invited you to Frameo — decide what to watch next together.`,
						)
					}
					className={cn(
						buttonClass,
						"border-[var(--color-signal-border)] text-[var(--color-signal)] hover:bg-[var(--color-signal-muted)] hover:text-[var(--color-signal)]",
					)}
				>
					{busy === "invite" ? (
						<UserPlus className="h-3.5 w-3.5 animate-pulse" />
					) : (
						<UserPlus className="h-3.5 w-3.5" />
					)}
					Invite friend
				</button>
			) : null}
		</div>
	)
}
