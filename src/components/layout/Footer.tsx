import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080808]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-white/60 md:flex-row">
        <div className="font-heading text-xl text-[#C9A84C]">CineAI</div>
        <p>Powered by TMDB + Gemini AI</p>
        <div className="flex items-center gap-4">
          <span className="text-white/40">TMDB attribution</span>
          <Link href="/terms" className="transition-colors duration-200 hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="transition-colors duration-200 hover:text-white">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
