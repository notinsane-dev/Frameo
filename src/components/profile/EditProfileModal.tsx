"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { useToastContext } from "@/components/shared/ToastProvider"
import { trpc } from "@/lib/trpc/client"

type EditProfileModalProps = {
  isOpen: boolean
  onClose: () => void
  user: {
    name?: string | null
    username?: string | null
    image?: string | null
    bio?: string | null
    isPublic?: boolean | null
  } | null
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export function EditProfileModal({ isOpen, onClose, user }: EditProfileModalProps) {
  const { showToast } = useToastContext()
  const utils = trpc.useUtils()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [debouncedUsername, setDebouncedUsername] = useState("")

  useEffect(() => {
    setName(user?.name || "")
    setUsername(user?.username || "")
    setBio(user?.bio || "")
    setIsPublic(user?.isPublic ?? true)
  }, [user])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedUsername(username.trim().toLowerCase()), 500)
    return () => window.clearTimeout(timer)
  }, [username])

  const normalizedName = name.trim()
  const normalizedUsername = username.trim().toLowerCase()
  const normalizedBio = bio.trim()

  const originalName = (user?.name || "").trim()
  const originalUsername = (user?.username || "").trim().toLowerCase()
  const originalBio = (user?.bio || "").trim()
  const originalIsPublic = user?.isPublic ?? true

  const usernameChanged = normalizedUsername !== originalUsername
  const hasChanges =
    normalizedName !== originalName ||
    normalizedUsername !== originalUsername ||
    normalizedBio !== originalBio ||
    isPublic !== originalIsPublic

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
      showToast("Profile updated!", "success")
      onClose()
    },
    onError: (error) => {
      showToast(error.message || "Failed to update profile", "error")
    },
  })

  const save = () => {
    updateMutation.mutate({
      name: normalizedName,
      username: normalizedUsername,
      bio: normalizedBio,
      isPublic,
    })
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/70" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#111111] p-6"
          >
            <button type="button" onClick={onClose} className="absolute right-4 top-4 text-white/50">
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-playfair text-3xl text-white">Edit Profile</h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="mb-2 text-sm text-white/70">Profile Picture</p>
                <AvatarUpload currentImage={user?.image} name={name || "User"} size="xl" editable onUpload={() => utils.user.getProfile.invalidate()} />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">Display Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">Username</label>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none"
                />
                {usernameChanged && USERNAME_REGEX.test(debouncedUsername) ? (
                  <p className={`mt-1 text-xs ${usernameCheck.data?.available ? "text-emerald-400" : "text-red-400"}`}>
                    {usernameCheck.isFetching ? "Checking..." : usernameCheck.data?.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-white/70">Bio</label>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value.slice(0, 200))}
                  className="h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none"
                />
                <p className="mt-1 text-xs text-white/40">{bio.length}/200</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/90">Public profile</p>
                    <p className="text-xs text-white/50">Anyone can view your profile and watchlist</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic((prev) => !prev)}
                    className={`relative h-6 w-11 overflow-hidden rounded-full transition-colors ${isPublic ? "bg-[#C9A84C]" : "bg-white/20"}`}
                    aria-label="Toggle public profile"
                    aria-pressed={isPublic}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${isPublic ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={save}
              disabled={updateMutation.isPending || !canSave}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808] disabled:opacity-70"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
