import type { TMDBVideo } from "@/lib/tmdb/types"

export function getTrailerKey(videos: TMDBVideo[]): string | null {
  if (!videos || videos.length === 0) return null

  const officialTrailer = videos.find(
    (video) => video.site === "YouTube" && video.type === "Trailer" && video.official === true,
  )
  if (officialTrailer) return officialTrailer.key

  const anyTrailer = videos.find((video) => video.site === "YouTube" && video.type === "Trailer")
  if (anyTrailer) return anyTrailer.key

  const officialTeaser = videos.find(
    (video) => video.site === "YouTube" && video.type === "Teaser" && video.official === true,
  )
  if (officialTeaser) return officialTeaser.key

  const anyYouTube = videos.find((video) => video.site === "YouTube")
  return anyYouTube ? anyYouTube.key : null
}

export function getImageUrl(
  path: string | null,
  size: "w200" | "w500" | "w780" | "w1280" | "original" = "w500",
): string {
  if (!path) return "/placeholder-movie.jpg"
  return `${process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE}/${size}${path}`
}
