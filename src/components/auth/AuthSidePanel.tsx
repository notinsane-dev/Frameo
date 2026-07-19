import { Sparkles } from "lucide-react"

const posterPaths = [
  "/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg",
  "/hU42CRk14JuPEdqZG3AWmagiPAP.jpg",
  "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
  "/rSPw7tgCH9c6NqICZef4kZjFOQ5.jpg",
  "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
  "/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg",
  "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
  "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  "/fTrQsdMS2MUw00RnzH0r3JWHhts.jpg",
]

type AuthSidePanelProps = {
  title: string
  subtitle: string
}

export function AuthSidePanel({ title, subtitle }: AuthSidePanelProps) {
  return (
    <div className="relative hidden overflow-hidden border-r border-white/10 lg:block">
      <div className="absolute inset-0 grid grid-cols-3 gap-3 p-4 opacity-20 blur-[1px]">
        {posterPaths.map((path) => (
          <div
            key={path}
            className="rounded-lg bg-cover bg-center"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w500${path})` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(201,168,76,0.26),transparent_40%),linear-gradient(145deg,rgba(7,7,7,0.88),rgba(9,9,9,0.98))]" />

      <div className="absolute left-10 top-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#C9A84C]">
        <Sparkles className="h-3.5 w-3.5" />
        CineAI Recommends
      </div>

      <div className="relative z-10 flex h-full flex-col justify-end p-10 pb-14">
        <h2 className="max-w-lg font-playfair text-6xl leading-[1.02] text-white">{title}</h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">{subtitle}</p>

        <div className="mt-7 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">AI-curated</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">Zero scroll fatigue</span>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">Built for movie nights</span>
        </div>
      </div>
    </div>
  )
}
