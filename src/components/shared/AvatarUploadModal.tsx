"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CloudUpload, Loader2, X } from "lucide-react"
import { useMemo, useRef, useState } from "react"

import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { useToastContext } from "@/components/shared/ToastProvider"

type AvatarUploadModalProps = {
  isOpen: boolean
  onClose: () => void
  onUpload: (url: string) => void
  currentImage?: string | null
  name: string
  userId?: string
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024

export function AvatarUploadModal({ isOpen, onClose, onUpload, currentImage, name }: AvatarUploadModalProps) {
  const { showToast } = useToastContext()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const fileMeta = useMemo(() => {
    if (!file) return null
    const kb = Math.max(1, Math.round(file.size / 1024))
    return `${file.name} • ${kb}KB`
  }, [file])

  const resetState = () => {
    setFile(null)
    setPreviewUrl(null)
    setProgress(0)
    setError("")
    setIsUploading(false)
  }

  const handleFile = (nextFile: File) => {
    setError("")

    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Only PNG, JPG, and WEBP are allowed")
      return
    }

    if (nextFile.size > MAX_SIZE) {
      setError("File must be 2MB or less")
      return
    }

    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
  }

  const upload = async () => {
    if (!file) {
      setError("Please select an image")
      return
    }

    setError("")
    setIsUploading(true)

    const ticker = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10))
    }, 120)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.error || "Upload failed")
      }

      setProgress(100)
      onUpload(payload.url)
      showToast("Profile picture updated", "success")
      onClose()
      resetState()
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed")
    } finally {
      window.clearInterval(ticker)
      setIsUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              onClose()
              resetState()
            }}
            className="fixed inset-0 z-50 bg-black/70"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            className="fixed left-1/2 top-1/2 z-[60] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#111111] p-6"
          >
            <button
              type="button"
              onClick={() => {
                onClose()
                resetState()
              }}
              className="absolute right-4 top-4 text-white/50"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="font-playfair text-3xl text-white">Update profile picture</h2>

            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const dropped = event.dataTransfer.files?.[0]
                if (dropped) handleFile(dropped)
              }}
              onClick={() => inputRef.current?.click()}
              className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center ${error ? "border-red-500/60" : "border-white/20"}`}
            >
              <CloudUpload className="mx-auto h-8 w-8 text-white/60" />
              <p className="mt-2 text-sm text-white/80">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-white/50">PNG, JPG, WEBP up to 5MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const selected = event.target.files?.[0]
                  if (selected) handleFile(selected)
                  event.target.value = ""
                }}
              />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <AvatarUpload currentImage={previewUrl || currentImage} name={name} size="xl" editable={false} />
              <div>
                <p className="text-sm text-white/80">Preview</p>
                <p className="text-xs text-white/45">{fileMeta || "No file selected"}</p>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 text-xs text-[#C9A84C]"
                >
                  Change file
                </button>
              </div>
            </div>

            {isUploading ? (
              <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-[#C9A84C]" animate={{ width: `${progress}%` }} />
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={upload}
                disabled={isUploading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C9A84C] py-3 text-sm font-semibold text-[#080808]"
              >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Profile Picture
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  resetState()
                }}
                className="rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
