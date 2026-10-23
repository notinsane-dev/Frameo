"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { useToastContext } from "@/components/shared/ToastProvider"
import { STREAMING_PROVIDERS } from "@/lib/streaming/providers"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

type EditProfileModalProps = {
	isOpen: boolean
	onClose: () => void
	user: {
		name?: string | null
		username?: string | null
		image?: string | null
		bio?: string | null
		isPublic?: boolean | null
		streamingServices?: string[] | null
	} | null
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

const fieldClass =
	"w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-ink)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-text-muted)]"

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
	const { showToast } = useToastContext()
	const utils = trpc.useUtils()

	const [name, setName] = useState("")
	const [username, setUsername] = useState("")
	const [bio, setBio] = useState("")
	const [isPublic, setIsPublic] = useState(true)
	const [streamingServices, setStreamingServices] = useState<string[]>([])
	const [debouncedUsername, setDebouncedUsername] = useState("")

	useEffect(() => {
		const timer = setTimeout(() => {
			setName(user?.name || "")
			setUsername(user?.username || "")
			setBio(user?.bio || "")
			setIsPublic(user?.isPublic ?? true)
			setStreamingServices(user?.streamingServices ?? [])
		}, 0)
		return () => clearTimeout(timer)
	}, [user])

	useEffect(() => {
		if (!isOpen) return

		const previousOverflow = document.body.style.overflow
		document.body.style.overflow = "hidden"

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKeyDown)

		return () => {
			document.body.style.overflow = previousOverflow
			window.removeEventListener("keydown", onKeyDown)
		}
	}, [isOpen, onClose])

	useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedUsername(username.trim().toLowerCase()),
			500,
		)
		return () => window.clearTimeout(timer)
	}, [username])

	const normalizedName = name.trim()
	const normalizedUsername = username.trim().toLowerCase()
	const normalizedBio = bio.trim()

	const originalName = (user?.name || "").trim()
	const originalUsername = (user?.username || "").trim().toLowerCase()
	const originalBio = (user?.bio || "").trim()
	const originalIsPublic = user?.isPublic ?? true
	const originalStreaming = [...(user?.streamingServices ?? [])].sort().join(",")
	const currentStreaming = [...streamingServices].sort().join(",")

	const usernameChanged = normalizedUsername !== originalUsername
	const hasChanges =
		normalizedName !== originalName ||
		normalizedUsername !== originalUsername ||
		normalizedBio !== originalBio ||
		isPublic !== originalIsPublic ||
		currentStreaming !== originalStreaming

	const shouldCheckUsername =
		usernameChanged &&
		USERNAME_REGEX.test(debouncedUsername) &&
		debouncedUsername === normalizedUsername

	const usernameCheck = trpc.user.checkUsernameAvailable.useQuery(
		{ username: debouncedUsername || "_" },
		{ enabled: shouldCheckUsername },
	)

	const canSave = useMemo(() => {
		if (!hasChanges) return false
		if (!normalizedName) return false
		if (!USERNAME_REGEX.test(normalizedUsername)) return false

		if (usernameChanged) {
			if (usernameCheck.isFetching) return false
			if (debouncedUsername !== normalizedUsername) return false
			return Boolean(usernameCheck.data?.available)
		}

		return true
	}, [
		hasChanges,
		normalizedName,
		normalizedUsername,
		usernameChanged,
		usernameCheck.isFetching,
		usernameCheck.data?.available,
		debouncedUsername,
	])

	const updateMutation = trpc.user.updateProfile.useMutation({
		onSuccess: async () => {
			await Promise.all([utils.user.getProfile.invalidate()])
			showToast("Profile updated", "success")
			onClose()
		},
		onError: (error) => {
			showToast(error.message || "Failed to update profile", "error")
		},
	})

	const toggleService = (id: string) => {
		setStreamingServices((prev) =>
			prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
		)
	}

	const save = () => {
		updateMutation.mutate({
			name: normalizedName,
			username: normalizedUsername,
			bio: normalizedBio,
			isPublic,
			streamingServices,
		})
	}

	return (
		<AnimatePresence>
			{isOpen ? (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					data-lenis-prevent
				>
					<motion.button
						type="button"
						aria-label="Close dialog"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-[var(--color-ink)]/80 backdrop-blur-sm"
					/>
					<motion.div
						role="dialog"
						aria-modal="true"
						aria-labelledby="edit-profile-title"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						data-lenis-prevent
						data-lenis-prevent-wheel
						className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-6 shadow-xl"
						onClick={(event) => event.stopPropagation()}
						onWheel={(event) => event.stopPropagation()}
					>
						<button
							type="button"
							onClick={onClose}
							aria-label="Close"
							className="absolute right-3 top-3 rounded-md p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
						>
							<X className="h-4 w-4" />
						</button>

						<h2
							id="edit-profile-title"
							className="font-heading text-2xl font-bold tracking-tight text-[var(--color-text)]"
						>
							Edit profile
						</h2>

						<div className="mt-6 space-y-5">
							<div>
								<p className="mb-2 text-sm text-[var(--color-text-secondary)]">
									Profile picture
								</p>
								<AvatarUpload
									currentImage={user?.image}
									name={name || "User"}
									size="xl"
									editable
									onUpload={() => utils.user.getProfile.invalidate()}
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
									Display name
								</label>
								<input
									value={name}
									onChange={(event) => setName(event.target.value)}
									className={fieldClass}
								/>
							</div>

							<div>
								<label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
									Username
								</label>
								<input
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									className={fieldClass}
								/>
								{usernameChanged && USERNAME_REGEX.test(debouncedUsername) ? (
									<p
										className={cn(
											"mt-1 text-xs",
											usernameCheck.data?.available
												? "text-emerald-400"
												: "text-red-400",
										)}
									>
										{usernameCheck.isFetching
											? "Checking…"
											: usernameCheck.data?.message}
									</p>
								) : null}
							</div>

							<div>
								<label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
									Bio
								</label>
								<textarea
									value={bio}
									onChange={(event) => setBio(event.target.value.slice(0, 200))}
									rows={3}
									className={cn(fieldClass, "resize-none")}
								/>
								<p className="mt-1 font-mono text-[11px] text-[var(--color-text-muted)]">
									{bio.length}/200
								</p>
							</div>

							<div>
								<p className="mb-1 text-sm text-[var(--color-text-secondary)]">
									Streaming services
								</p>
								<p className="mb-3 text-xs text-[var(--color-text-muted)]">
									Used for “Watchable now” recommendations
								</p>
								<div className="flex flex-wrap gap-2">
									{STREAMING_PROVIDERS.map((provider) => {
										const selected = streamingServices.includes(provider.id)
										return (
											<button
												key={provider.id}
												type="button"
												onClick={() => toggleService(provider.id)}
												className={cn(
													"rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
													selected
														? "border-[var(--color-signal)] bg-[var(--color-signal-muted)] text-[var(--color-signal)]"
														: "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]",
												)}
											>
												{provider.name}
											</button>
										)
									})}
								</div>
							</div>

							<div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] px-4 py-3">
								<div>
									<p className="text-sm text-[var(--color-text)]">Public profile</p>
									<p className="text-xs text-[var(--color-text-muted)]">
										Anyone can view your profile and watchlist
									</p>
								</div>
								<button
									type="button"
									onClick={() => setIsPublic((prev) => !prev)}
									className={cn(
										"relative h-6 w-11 overflow-hidden rounded-full transition-colors",
										isPublic ? "bg-[var(--color-signal)]" : "bg-white/20",
									)}
									aria-label="Toggle public profile"
									aria-pressed={isPublic}
								>
									<span
										className={cn(
											"absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
											isPublic ? "translate-x-5" : "translate-x-0",
										)}
									/>
								</button>
							</div>
						</div>

						<button
							type="button"
							onClick={save}
							disabled={updateMutation.isPending || !canSave}
							className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-40"
						>
							{updateMutation.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : null}
							Save changes
						</button>
					</motion.div>
				</div>
			) : null}
		</AnimatePresence>
	)
}
