import { Clapperboard } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="gold-glow animate-pulse rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4 text-[#C9A84C]">
          <Clapperboard className="h-12 w-12" />
        </div>
        <p className="font-playfair text-2xl text-white/90">Loading...</p>
        <p className="text-sm text-white/30">Preparing your cinematic experience</p>
      </div>
    </div>
  )
}
