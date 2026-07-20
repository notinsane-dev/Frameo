"use client"

import { MoreHorizontal } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"

type Friend = {
	id: string
	name: string
	image: string | null
	username: string | null
	bio: string | null
}

type FriendCardProps = {
	friend: Friend
	onViewProfile: () => void
	onRemove: () => void
}

export function FriendCard({ friend, onViewProfile, onRemove }: FriendCardProps) {
	const [menuOpen, setMenuOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!menuOpen) return
		const onPointerDown = (event: MouseEvent) => {
			if (!menuRef.current?.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}
		window.addEventListener("mousedown", onPointerDown)
		return () => window.removeEventListener("mousedown", onPointerDown)
	}, [menuOpen])

	return (
		<article className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]">
			<button
				type="button"
				onClick={onViewProfile}
				className="flex min-w-0 flex-1 items-center gap-3 text-left"
			>
				<AvatarUpload
					currentImage={friend.image}
					name={friend.name}
					size="md"
					editable={false}
				/>
				<div className="min-w-0">
					<p className="truncate text-sm font-medium text-[var(--color-text)]">
						{friend.name}
					</p>
					<p className="truncate text-xs text-[var(--color-text-muted)]">
						@{friend.username || "user"}
					</p>
					{friend.bio ? (
						<p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
							{friend.bio}
						</p>
					) : null}
				</div>
			</button>

			<button
				type="button"
				onClick={onViewProfile}
				className="hidden rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)] sm:inline-flex"
			>
				Profile
			</button>

			<div className="relative" ref={menuRef}>
				<button
					type="button"
					onClick={() => setMenuOpen((prev) => !prev)}
					aria-label="Friend options"
					aria-expanded={menuOpen}
					className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.05] hover:text-[var(--color-text)]"
				>
					<MoreHorizontal className="h-4 w-4" />
				</button>

				{menuOpen ? (
					<div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-1 shadow-lg">
						<button
							type="button"
							onClick={() => {
								setMenuOpen(false)
								onRemove()
							}}
							className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-300/90 hover:bg-white/[0.04]"
						>
							Remove
						</button>
					</div>
				) : null}
			</div>
		</article>
	)
}
