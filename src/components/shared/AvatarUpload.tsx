"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Camera, CheckCircle2, Loader2, UserRound } from "lucide-react"
import Image from "next/image"
import { useMemo, useRef, useState } from "react"

import { useToastContext } from "@/components/shared/ToastProvider"
import { cn } from "@/lib/utils"
import { extractCloudinaryPublicId, getOptimizedAvatarUrl } from "@/lib/cloudinary/url"

type AvatarUploadProps = {
  currentImage?: string | null
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  onUpload?: (url: string) => void
  editable?: boolean
  userId?: string
}

const SIZE_MAP = {
  sm: 40,
  md: 64,
  lg: 96,
  xl: 128,
} as const

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024
const COLORS = [
  "from-purple-600 to-blue-600",
  "from-red-600 to-orange-600",
  "from-green-600 to-teal-600",
  "from-pink-600 to-rose-600",
  "from-yellow-600 to-amber-600",
  "from-indigo-600 to-violet-600",
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "U"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function getColorClass(name: string) {
  const value = name.charCodeAt(0) || 0
  return COLORS[value % COLORS.length]
}

async function validateMinDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new window.Image()
    const result = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      image.onload = () => resolve({ width: image.width, height: image.height })
      image.onerror = () => reject(new Error("Failed to read image dimensions"))
      image.src = objectUrl
    })

    if (result.width < 100 || result.height < 100) {
      throw new Error("Image dimensions must be at least 100x100")
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function AvatarUpload({
  currentImage,
  name,
  size = "md",
  onUpload,
  editable = false,
}: AvatarUploadProps) {
  const { showToast } = useToastContext()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const px = SIZE_MAP[size]
  const initials = useMemo(() => getInitials(name), [name])
  const fallbackGradient = useMemo(() => getColorClass(name), [name])

  const displayImage = useMemo(() => {
    if (previewUrl) return previewUrl
    if (!currentImage) return null

    const publicId = extractCloudinaryPublicId(currentImage)
    if (!publicId) return currentImage

    const optimized = getOptimizedAvatarUrl(
      publicId,
      px <= 40 ? 40 : px <= 80 ? 80 : px <= 160 ? 160 : 400,
    )

    return optimized || currentImage
  }, [currentImage, previewUrl, px])

  const handleSelect = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showToast("Only JPEG, PNG, or WEBP images are allowed", "error")
      return
    }

    if (file.size > MAX_SIZE) {
      showToast("Avatar must be 2MB or less", "error")
      return
    }

    try {
      await validateMinDimensions(file)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Invalid image dimensions", "error")
      return
    }

    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Avatar upload failed")
      }

      setPreviewUrl(payload.url)
      onUpload?.(payload.url)
      setUploadSuccess(true)
      showToast("Profile picture updated", "success")
      window.setTimeout(() => setUploadSuccess(false), 1200)
    } catch (error) {
      setPreviewUrl(null)
      showToast(error instanceof Error ? error.message : "Avatar upload failed", "error")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative inline-flex">
      {editable ? (
        <button
          type="button"
          onClick={() => {
            inputRef.current?.click()
          }}
          className={cn(
            "group relative overflow-hidden rounded-full border border-white/10 bg-white/5 cursor-pointer",
          )}
          style={{ width: px, height: px }}
        >
          {displayImage ? (
            <Image src={displayImage} alt={name} fill sizes={`${px}px`} className="object-cover" />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", fallbackGradient)}>
              {initials ? (
                <span className={cn("font-semibold text-white", px >= 96 ? "text-3xl" : px >= 64 ? "text-xl" : "text-sm")}>{initials}</span>
              ) : (
                <UserRound className="h-6 w-6 text-white" />
              )}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/45"
          >
            <Camera className="h-4 w-4 text-white" />
          </motion.div>

          <AnimatePresence>
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/55"
              >
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {uploadSuccess ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-emerald-500/70"
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </button>
      ) : (
        <div
          className="relative overflow-hidden rounded-full border border-white/10 bg-white/5"
          style={{ width: px, height: px }}
        >
          {displayImage ? (
            <Image src={displayImage} alt={name} fill sizes={`${px}px`} className="object-cover" />
          ) : (
            <div className={cn("flex h-full w-full items-center justify-center bg-gradient-to-br", fallbackGradient)}>
              {initials ? (
                <span className={cn("font-semibold text-white", px >= 96 ? "text-3xl" : px >= 64 ? "text-xl" : "text-sm")}>{initials}</span>
              ) : (
                <UserRound className="h-6 w-6 text-white" />
              )}
            </div>
          )}

          <AnimatePresence>
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/55"
              >
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {uploadSuccess ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-emerald-500/70"
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      )}

      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleSelect(file)
            }
            event.target.value = ""
          }}
          className="hidden"
        />
      ) : null}
    </div>
  )
}
