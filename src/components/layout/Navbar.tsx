"use client"

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion"
import { Clapperboard, Menu, Search, User as UserIcon, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { NotificationBell } from "@/components/friends/NotificationBell"
import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { SearchBar } from "@/components/shared/SearchBar"
import { useAuth } from "@/hooks/useAuth"
import { signOut } from "@/lib/auth/auth-client"
import { trpc } from "@/lib/trpc/client"
import { getTrpcClient } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { useToastContext } from "@/components/shared/ToastProvider"
import type { TMDBMovie } from "@/lib/tmdb/types"

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "Friends", href: "/friends" },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()
  const { data: profile } = trpc.user.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  })
  const { showToast } = useToastContext()
  const navbarName = profile?.name || user?.name || "Movie Lover"
  const navbarImage = profile?.image || user?.image
  const navbarUsername = profile?.username || user?.username
  const navbarEmail = profile?.email || user?.email


  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<TMDBMovie[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [scrolled, setScrolled] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 20)
  })

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!isDropdownOpen) return

      const target = event.target
      if (!(target instanceof Node)) return

      if (userMenuRef.current?.contains(target)) return
      setIsDropdownOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
    }
  }, [isDropdownOpen])

  const handleSearch = async (query: string) => {
    if (!isSearchOpen) return
    if (!query) return

    try {
      const trpcClient = getTrpcClient()
      const result = await trpcClient.movies.search.query({ query, page: 1 })
      const suggestions = result.results.slice(0, 6)

      if (suggestions.length === 0) {
        setSearchSuggestions([])
        showToast("No movies found for your search", "info")
        return
      }

      setSearchQuery(query)
      setSearchSuggestions(suggestions)
    } catch {
      showToast("Search failed. Please try again.", "error")
    }
  }

  const handleSuggestionSelect = (movieId: number) => {
    router.push(`/movie/${movieId}`)
    setIsSearchOpen(false)
    setSearchSuggestions([])
    setSearchQuery("")
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-white/10 bg-black/60 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5 text-[#C9A84C]" />
          <span className="font-heading text-2xl text-[#C9A84C]">CineAI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm transition-colors duration-200",
                  isActive ? "text-[#C9A84C]" : "text-white/70 hover:text-white",
                )}
              >
                {link.label}
                {isActive ? <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#C9A84C]" /> : null}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className={cn("relative hidden md:block", isSearchOpen ? "w-72" : "w-10")}>
            {isSearchOpen ? (
              <SearchBar
                className="w-full"
                placeholder="Search movies"
                onSearch={handleSearch}
                searchOnType={false}
                submitOnEnter
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(true)
                  setSearchSuggestions([])
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors duration-200 hover:text-white"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>
            )}

            <AnimatePresence>
              {isSearchOpen && searchSuggestions.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 z-50 mt-2 w-96 rounded-xl border border-white/10 bg-[#111111] p-2 shadow-2xl"
                >
                  <p className="px-3 py-2 text-xs uppercase tracking-wide text-white/40">
                    Suggestions for "{searchQuery}"
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    {searchSuggestions.map((movie) => (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => handleSuggestionSelect(movie.id)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-white/5"
                      >
                        <span className="line-clamp-1 text-sm text-white/85">{movie.title}</span>
                        <span className="ml-3 text-xs text-white/45">
                          {movie.release_date ? movie.release_date.slice(0, 4) : "TBA"}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {isAuthenticated ? <NotificationBell /> : null}

          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5"
                aria-label="Open user menu"
              >
                <AvatarUpload
                  currentImage={navbarImage}
                  name={navbarName || navbarEmail || "User"}
                  size="sm"
                  editable={false}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-[#111111] p-2 shadow-2xl"
                  >
                    <div className="mb-2 border-b border-white/10 px-3 pb-2">
                      <p className="line-clamp-1 text-sm font-medium text-white/90">{navbarName}</p>
                      <p className="line-clamp-1 text-xs text-white/50">
                        {navbarUsername ? `@${navbarUsername}` : navbarEmail || "No username yet"}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/watchlist"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                    >
                      Watchlist
                    </Link>
                    <Link
                      href="/friends"
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                    >
                      Friends
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        void signOut().then(() => router.push("/"))
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-[#C9A84C] px-4 py-2 text-sm font-medium text-[#C9A84C] transition-colors duration-200 hover:bg-[#C9A84C]/10 md:inline-flex"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#080808] p-6 md:hidden"
          >
            <div className="mb-8 flex items-center justify-between">
              <span className="font-heading text-2xl text-[#C9A84C]">CineAI</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "block text-2xl font-medium",
                    pathname === link.href ? "text-[#C9A84C]" : "text-white/80",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <SearchBar
                onSearch={async (query) => {
                  if (!query) return

                  try {
                    const trpcClient = getTrpcClient()
                    const result = await trpcClient.movies.search.query({ query, page: 1 })
                    const firstMovie = result.results[0]

                    if (!firstMovie) {
                      showToast("No movies found for your search", "info")
                      return
                    }

                    router.push(`/movie/${firstMovie.id}`)
                    setIsMenuOpen(false)
                  } catch {
                    showToast("Search failed. Please try again.", "error")
                  }
                }}
                searchOnType={false}
                submitOnEnter
              />
            </div>

            <div className="mt-10">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    void signOut().then(() => router.push("/"))
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white"
                >
                  <UserIcon className="h-4 w-4" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex rounded-full border border-[#C9A84C] px-4 py-2 text-[#C9A84C]"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  )
}
