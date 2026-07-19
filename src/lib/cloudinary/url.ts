const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export function extractCloudinaryPublicId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes("res.cloudinary.com")) return null

    const segments = parsed.pathname.split("/").filter(Boolean)
    const uploadIndex = segments.findIndex((value) => value === "upload")
    if (uploadIndex < 0) return null

    const afterUpload = segments.slice(uploadIndex + 1)
    const withoutTransforms = afterUpload.filter((segment) => !segment.startsWith("v") || Number.isNaN(Number(segment.slice(1))))
    if (withoutTransforms.length === 0) return null

    const joined = withoutTransforms.join("/")
    return joined.replace(/\.[a-zA-Z0-9]+$/, "")
  } catch {
    return null
  }
}

export function getOptimizedAvatarUrl(publicId: string, size: 40 | 80 | 160 | 400 = 80): string {
  if (!CLOUD_NAME) return ""
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/c_fill,g_face,q_auto:best,f_auto,r_max,w_${size},h_${size}/${publicId}`
}
