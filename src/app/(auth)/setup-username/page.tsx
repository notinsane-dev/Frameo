"use client"

import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { AuthCardShell } from "@/components/auth/AuthShell"
import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useAuth } from "@/hooks/useAuth"
import { useClaimInvite } from "@/hooks/useClaimInvite"
import { trpc } from "@/lib/trpc/client"
import { generateUsernameSuggestions } from "@/lib/utils/username"
import { cn } from "@/lib/utils"

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

export default function SetupUsernamePage() {
	const router = useRouter()
	const { showToast } = useToastContext()
	const { claimPendingInvite } = useClaimInvite()
	const { user, isLoading, isAuthenticated, hasUsername } = useAuth()

	const [username, setUsername] = useState("")
	const [debouncedUsername, setDebouncedUsername] = useState("")
	const [error, setError] = useState("")
	const [isSaving, setIsSaving] = useState(false)
	const [useExistingPhoto, setUseExistingPhoto] = useState(true)
	const [avatarFile, setAvatarFile] = useState<File | null>(null)
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
	const fileInputRef = useRef<HTMLInputElement | null>(null)

	const setUsernameMutation = trpc.user.setUsername.useMutation()

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedUsername(username.trim().toLowerCase()), 500)
		return () => clearTimeout(timer)
	}, [username])

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.replace("/login")
		}

		if (!isLoading && isAuthenticated && hasUsername) {
			router.replace("/")
		}
	}, [hasUsername, isAuthenticated, isLoading, router])

	const { data, isFetching } = trpc.user.checkUsernameAvailable.useQuery(
		{ username: debouncedUsername || "_" },
		{ enabled: debouncedUsername.length >= 3 },
	)

	const suggestions = useMemo(
		() => generateUsernameSuggestions(user?.name || "user"),
		[user?.name],
	)

	const isValid = USERNAME_REGEX.test(username.trim())
	const isAvailable = isValid && Boolean(data?.available)

	const validateDimensions = async (file: File) => {
		const localUrl = URL.createObjectURL(file)
		try {
			const image = new window.Image()
			const dimensions = await new Promise<{ width: number; height: number }>(
				(resolve, reject) => {
					image.onload = () => resolve({ width: image.width, height: image.height })
					image.onerror = () => reject(new Error("Invalid image file"))
					image.src = localUrl
				},
			)
			if (dimensions.width < 100 || dimensions.height < 100) {
				throw new Error("Image must be at least 100x100")
			}
		} finally {
			URL.revokeObjectURL(localUrl)
		}
	}

	const handleAvatarFile = async (file: File) => {
		if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
			setError("Avatar must be JPEG, PNG, or WEBP")
			return
		}

		if (file.size > MAX_AVATAR_SIZE) {
			setError("Avatar must be 2MB or less")
			return
		}

		try {
			await validateDimensions(file)
		} catch (dimensionError) {
			setError(dimensionError instanceof Error ? dimensionError.message : "Invalid image")
			return
		}

		setError("")
		setAvatarFile(file)
		setAvatarPreview(URL.createObjectURL(file))
	}

	const handleSave = async () => {
		const normalized = username.trim().toLowerCase()

		if (!USERNAME_REGEX.test(normalized)) {
			setError("Only letters, numbers, and underscores (3-20 chars)")
			return
		}

		setError("")
		setIsSaving(true)

		try {
			await setUsernameMutation.mutateAsync({ username: normalized })
		} catch (mutationError) {
			const message =
				mutationError instanceof Error ? mutationError.message : "Failed to set username"
			setError(message)
			setIsSaving(false)
			return
		}

		if (!useExistingPhoto && avatarFile) {
			const formData = new FormData()
			formData.append("avatar", avatarFile)
			const uploadResponse = await fetch("/api/upload/avatar", {
				method: "POST",
				body: formData,
			})
			if (!uploadResponse.ok) {
				setIsSaving(false)
				setError("Username saved, but avatar upload failed")
				return
			}
		}

		setIsSaving(false)
		showToast("Username saved", "success")
		const claimed = await claimPendingInvite({ redirect: true })
		if (!claimed) router.push("/")
	}

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)]">
				<LoadingSpinner />
			</div>
		)
	}

	return (
		<AuthCardShell>
			<div data-auth-bit>
				<FrameoLogo />
			</div>

			<h1
				data-auth-bit
				className="mt-6 font-heading text-3xl font-bold tracking-tight text-[var(--color-text)]"
			>
				One last step
			</h1>
			<p data-auth-bit className="mt-2 text-sm text-[var(--color-text-secondary)]">
				Choose a username to complete your profile
			</p>

			<div
				data-auth-bit
				className="mt-6 border-t border-[var(--color-border)] pt-5"
			>
				<p className="text-sm text-[var(--color-text-secondary)]">Profile photo</p>
				<div className="mt-3 flex items-center gap-4">
					<AvatarUpload
						currentImage={avatarPreview || user?.image}
						name={user?.name || "User"}
						size="lg"
						editable={false}
					/>
					<div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
						<label className="flex items-center gap-2">
							<input
								type="radio"
								checked={useExistingPhoto}
								onChange={() => setUseExistingPhoto(true)}
								className="accent-[var(--color-signal)]"
							/>
							Keep this photo
						</label>
						<label className="flex items-center gap-2">
							<input
								type="radio"
								checked={!useExistingPhoto}
								onChange={() => setUseExistingPhoto(false)}
								className="accent-[var(--color-signal)]"
							/>
							Upload a different photo
						</label>

						{!useExistingPhoto ? (
							<>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/jpeg,image/png,image/webp"
									className="hidden"
									onChange={(event) => {
										const file = event.target.files?.[0]
										if (file) void handleAvatarFile(file)
										event.target.value = ""
									}}
								/>
								<button
									type="button"
									onClick={() => fileInputRef.current?.click()}
									className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
								>
									Choose file
								</button>
							</>
						) : null}
					</div>
				</div>
			</div>

			<div data-auth-bit className="mt-6">
				<label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">
					Username
				</label>
				<div
					className={cn(
						"relative rounded-lg border bg-[var(--color-ink-elevated)]",
						isAvailable
							? "border-emerald-500/50"
							: error
								? "border-red-500/50"
								: "border-[var(--color-border)]",
					)}
				>
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
						@
					</span>
					<input
						value={username}
						onChange={(event) => {
							setError("")
							setUsername(event.target.value)
						}}
						placeholder="yourname"
						maxLength={20}
						className="w-full bg-transparent py-3 pl-7 pr-10 text-sm text-[var(--color-text)] outline-none"
					/>
					<span className="absolute right-3 top-1/2 -translate-y-1/2">
						{isFetching ? (
							<Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
						) : isAvailable ? (
							<CheckCircle2 className="h-4 w-4 text-emerald-400" />
						) : debouncedUsername.length >= 3 && !data?.available ? (
							<XCircle className="h-4 w-4 text-red-400" />
						) : null}
					</span>
				</div>

				{error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
				{!error && debouncedUsername.length >= 3 && data?.message ? (
					<p
						className={cn(
							"mt-1 text-xs",
							data.available ? "text-emerald-400" : "text-red-400",
						)}
					>
						{data.message}
					</p>
				) : null}
			</div>

			<div data-auth-bit className="mt-4 flex flex-wrap gap-2">
				{suggestions.map((suggestion) => (
					<button
						key={suggestion}
						type="button"
						onClick={() => setUsername(suggestion)}
						className="rounded-md border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
					>
						@{suggestion}
					</button>
				))}
			</div>

			<button
				data-auth-bit
				type="button"
				onClick={handleSave}
				disabled={!isAvailable || isFetching || isSaving}
				className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)] py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[#ff6b5a] disabled:opacity-70"
			>
				{isSaving ? (
					<LoadingSpinner size="sm" className="scale-75" />
				) : (
					<ArrowRight className="h-4 w-4" />
				)}
				Complete setup
			</button>
		</AuthCardShell>
	)
}
