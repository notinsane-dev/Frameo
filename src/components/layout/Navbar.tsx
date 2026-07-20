"use client"

import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion"
import { Search, User as UserIcon, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { NotificationBell } from "@/components/friends/NotificationBell"
import { FrameoLogo } from "@/components/auth/FrameoLogo"
import { AvatarUpload } from "@/components/shared/AvatarUpload"
import { SearchBar } from "@/components/shared/SearchBar"
import { useToastContext } from "@/components/shared/ToastProvider"
import { useAuth } from "@/hooks/useAuth"
import { signOut } from "@/lib/auth/auth-client"
import { startLenis, stopLenis, getLenisInstance } from "@/lib/lenis"
import { getTrpcClient, trpc } from "@/lib/trpc/client"
import type { TMDBMovie } from "@/lib/tmdb/types"
import { cn } from "@/lib/utils"

const expoOut = [0.16, 1, 0.3, 1] as const
const springNav = { type: "spring" as const, stiffness: 420, damping: 36, mass: 0.8 }

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Charts", href: "/top-10" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "Together", href: "/watch-together" },
  { label: "Twins", href: "/taste-twins" },
  { label: "Diary", href: "/diary" },
  { label: "Friends", href: "/friends" },
]

const menuSheetVariants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { duration: 0.45, ease: expoOut },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.32, ease: expoOut },
  },
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <motion.span
        className="absolute left-0 top-0 block h-[1.5px] w-full origin-center rounded-full bg-current"
        animate={open ? { y: 6, rotate: 45 } : { y: 0, rotate: 0 }}
        transition={{ duration: 0.35, ease: expoOut }}
      />
      <motion.span
        className="absolute left-0 top-[6px] block h-[1.5px] w-full rounded-full bg-current"
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.25, ease: expoOut }}
      />
      <motion.span
        className="absolute left-0 top-[12px] block h-[1.5px] w-full origin-center rounded-full bg-current"
        animate={open ? { y: -6, rotate: -45 } : { y: 0, rotate: 0 }}
        transition={{ duration: 0.35, ease: expoOut }}
      />
    </span>
  )
}

function NavLinkLabel({ label }: { label: string }) {
  return (
    <motion.span
      className="inline-flex"
      initial="rest"
      whileHover="hover"
      animate="rest"
    >
      {label.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          custom={i}
          variants={{
            rest: { y: 0 },
            hover: (index: number) => ({
              y: -2,
              transition: {
                delay: index * 0.018,
                duration: 0.28,
                ease: expoOut,
              },
            }),
          }}
          className="inline-block will-change-transform"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

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
  const [navInk, setNavInk] = useState({ left: 0, width: 0, opacity: 0 })
  const [portalReady, setPortalReady] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef<HTMLDivElement | null>(null)
  const desktopNavRef = useRef<HTMLElement | null>(null)
  const desktopLinkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const hoveredNavHref = useRef<string | null>(null)

  const placeNavInk = useCallback((href: string | null) => {
    const nav = desktopNavRef.current
    if (!nav || !href) {
      setNavInk((prev) => ({ ...prev, opacity: 0 }))
      return
    }
    const link = desktopLinkRefs.current.get(href)
    if (!link) {
      setNavInk((prev) => ({ ...prev, opacity: 0 }))
      return
    }
    const navRect = nav.getBoundingClientRect()
    const linkRect = link.getBoundingClientRect()
    setNavInk({
      left: linkRect.left - navRect.left + 10,
      width: Math.max(linkRect.width - 20, 12),
      opacity: 1,
    })
  }, [])

  useLayoutEffect(() => {
    const target = hoveredNavHref.current ?? pathname
    placeNavInk(navLinks.some((l) => l.href === target) ? target : pathname)
  }, [pathname, placeNavInk])

  useEffect(() => {
    const onResize = () => {
      const target = hoveredNavHref.current ?? pathname
      placeNavInk(navLinks.some((l) => l.href === target) ? target : pathname)
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [pathname, placeNavInk])

  const { scrollY } = useScroll()
  const scrollProgress = useSpring(
    useTransform(scrollY, [0, 80], [0, 1], { clamp: true }),
    { stiffness: 140, damping: 28, mass: 0.35 },
  )
  const headerBg = useTransform(
    scrollProgress,
    [0, 1],
    ["rgba(11, 13, 18, 0)", "rgba(11, 13, 18, 0.82)"],
  )
  const headerBorder = useTransform(
    scrollProgress,
    [0, 1],
    ["rgba(232, 234, 238, 0)", "rgba(232, 234, 238, 0.08)"],
  )
  const headerBlur = useTransform(scrollProgress, [0, 1], ["blur(0px)", "blur(18px)"])

  useMotionValueEvent(scrollY, "change", (value) => {
    setScrolled(value > 20)
  })

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    if (!isMenuOpen) return

    const { body, documentElement } = document
    const scrollY = window.scrollY
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      htmlOverflow: documentElement.style.overflow,
    }

    stopLenis()
    documentElement.style.overflow = "hidden"
    body.style.overflow = "hidden"
    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"

    return () => {
      documentElement.style.overflow = previous.htmlOverflow
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.left = previous.left
      body.style.right = previous.right
      body.style.width = previous.width
      window.scrollTo(0, scrollY)
      startLenis()
      getLenisInstance()?.scrollTo(scrollY, { immediate: true })
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (isDropdownOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsDropdownOpen(false)
      }
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false)
        setSearchSuggestions([])
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
    }
  }, [isDropdownOpen, isSearchOpen, searchSuggestions.length])

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
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: expoOut }}
      style={{
        backgroundColor: headerBg,
        borderBottomColor: headerBorder,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur,
      }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b",
        scrolled ? "shadow-[0_8px_32px_rgba(0,0,0,0.25)]" : "shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="group relative z-10 flex items-center gap-2" aria-label="Frameo home">
          <motion.span
            whileHover={{ y: -1 }}
            transition={{ duration: 0.35, ease: expoOut }}
            className="inline-flex"
          >
            <FrameoLogo size="lg" priority />
          </motion.span>
        </Link>

        <nav
          ref={desktopNavRef}
          className="relative hidden items-center md:flex"
          aria-label="Primary"
          onMouseLeave={() => {
            hoveredNavHref.current = null
            placeNavInk(pathname)
          }}
        >
          <motion.span
            aria-hidden
            className="pointer-events-none absolute bottom-1 h-[2px] rounded-full bg-[var(--color-signal)]"
            initial={false}
            animate={{
              left: navInk.left,
              width: navInk.width,
              opacity: navInk.opacity,
            }}
            transition={springNav}
          />
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(node) => {
                  if (node) desktopLinkRefs.current.set(link.href, node)
                  else desktopLinkRefs.current.delete(link.href)
                }}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => {
                  hoveredNavHref.current = link.href
                  placeNavInk(link.href)
                }}
                className={cn(
                  "relative z-[1] px-2.5 py-2 text-sm transition-colors duration-300",
                  isActive
                    ? "text-[var(--color-signal)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]",
                )}
              >
                <NavLinkLabel label={link.label} />
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div ref={searchRef} className="relative hidden md:block">
            <motion.div
              layout
              transition={{ duration: 0.45, ease: expoOut }}
              className={cn("overflow-hidden", isSearchOpen ? "w-72" : "w-10")}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isSearchOpen ? (
                  <motion.div
                    key="search-open"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.35, ease: expoOut }}
                    className="flex items-center gap-2"
                  >
                    <SearchBar
                      className="w-full"
                      placeholder="Search movies"
                      onSearch={handleSearch}
                      searchOnType={false}
                      submitOnEnter
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchSuggestions([])
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="search-closed"
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ duration: 0.3, ease: expoOut }}
                    onClick={() => {
                      setIsSearchOpen(true)
                      setSearchSuggestions([])
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]"
                    aria-label="Open search"
                  >
                    <Search className="h-4 w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {isSearchOpen && searchSuggestions.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: expoOut }}
                  className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
                >
                  <p className="px-3 py-2 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                    Suggestions for &quot;{searchQuery}&quot;
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    {searchSuggestions.map((movie, index) => (
                      <motion.button
                        key={movie.id}
                        type="button"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3, ease: expoOut }}
                        onClick={() => handleSuggestionSelect(movie.id)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-[var(--color-signal-muted)]"
                      >
                        <span className="line-clamp-1 text-sm text-[var(--color-text)]">
                          {movie.title}
                        </span>
                        <span className="ml-3 text-xs text-[var(--color-text-secondary)]">
                          {movie.release_date ? movie.release_date.slice(0, 4) : "TBA"}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {isAuthenticated ? <NotificationBell /> : null}

          {isAuthenticated ? (
            <div ref={userMenuRef} className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-card)]"
                aria-label="Open user menu"
                aria-expanded={isDropdownOpen}
              >
                <AvatarUpload
                  currentImage={navbarImage}
                  name={navbarName || navbarEmail || "User"}
                  size="sm"
                  editable={false}
                />
              </motion.button>

              <AnimatePresence>
                {isDropdownOpen ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: -10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96, y: -6, filter: "blur(4px)" }}
                    transition={{ duration: 0.32, ease: expoOut }}
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[var(--color-border)] bg-[var(--color-ink-elevated)] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
                  >
                    <div className="mb-2 border-b border-[var(--color-border)] px-3 pb-2">
                      <p className="line-clamp-1 text-sm font-medium text-[var(--color-text)]">
                        {navbarName}
                      </p>
                      <p className="line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                        {navbarUsername ? `@${navbarUsername}` : navbarEmail || "No username yet"}
                      </p>
                    </div>
                    {(
                      [
                        ["Profile", "/profile"],
                        ["Watchlist", "/watchlist"],
                        ["Smart Log", "/diary"],
                        ["Taste Twins", "/taste-twins"],
                        ["Watch Together", "/watch-together"],
                        ["Friends", "/friends"],
                      ] as const
                    ).map(([label, href]) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-signal-muted)] hover:text-[var(--color-text)]"
                      >
                        {label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        void signOut().then(() => router.push("/"))
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-signal-muted)] hover:text-[var(--color-text)]"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="hidden md:block">
              <Link
                href="/login"
                className="inline-flex rounded-full border border-[var(--color-signal)] px-4 py-2 text-sm font-medium text-[var(--color-signal)] transition-colors duration-300 hover:bg-[var(--color-signal-muted)]"
              >
                Sign In
              </Link>
            </motion.div>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsMenuOpen((open) => !open)}
            className={cn(
              "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border text-[var(--color-text)] transition-colors md:hidden",
              isMenuOpen
                ? "pointer-events-none border-transparent opacity-0"
                : "border-[var(--color-border)] bg-[var(--color-bg-card)]",
            )}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
            tabIndex={isMenuOpen ? -1 : 0}
          >
            <HamburgerIcon open={false} />
          </motion.button>
        </div>
      </div>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {isMenuOpen ? (
                <motion.div
                  key="mobile-menu"
                  className="fixed inset-0 z-[100] md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  <motion.div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Navigation menu"
                    data-lenis-prevent
                    variants={menuSheetVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute inset-x-0 bottom-0 flex h-[min(92dvh,720px)] flex-col rounded-t-3xl border border-[var(--color-border)] border-b-0 bg-[var(--color-ink)]"
                  >
                    <div className="flex shrink-0 justify-center pb-2 pt-3" aria-hidden>
                      <div className="h-1 w-10 rounded-full bg-[var(--color-border-hover)]" />
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3">
                      <FrameoLogo size="sm" />
                      <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text)] transition-colors hover:border-[var(--color-signal-border)] hover:text-[var(--color-signal)]"
                        aria-label="Close menu"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <nav
                      aria-label="Mobile"
                      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3"
                    >
                      {navLinks.map((link, index) => {
                        const isActive = pathname === link.href
                        return (
                          <motion.div
                            key={link.href}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.06 + index * 0.035,
                              duration: 0.3,
                              ease: expoOut,
                            }}
                          >
                            <Link
                              href={link.href}
                              onClick={() => setIsMenuOpen(false)}
                              aria-current={isActive ? "page" : undefined}
                              className={cn(
                                "mb-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-colors",
                                isActive
                                  ? "bg-[var(--color-signal)] text-[var(--color-ink)]"
                                  : "text-[var(--color-text)] active:bg-white/[0.05]",
                              )}
                            >
                              <span
                                className={cn(
                                  "w-5 font-mono text-xs tabular-nums",
                                  isActive
                                    ? "text-[var(--color-ink)]/50"
                                    : "text-[var(--color-text-muted)]",
                                )}
                              >
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                                {link.label}
                              </span>
                            </Link>
                          </motion.div>
                        )
                      })}
                    </nav>

                    <div className="shrink-0 space-y-3 border-t border-[var(--color-border)] bg-[var(--color-ink)] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                      <SearchBar
                        disableFocusLayout
                        onSearch={async (query) => {
                          if (!query) return

                          try {
                            const trpcClient = getTrpcClient()
                            const result = await trpcClient.movies.search.query({
                              query,
                              page: 1,
                            })
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

                      {isAuthenticated ? (
                        <button
                          type="button"
                          onClick={() => {
                            void signOut().then(() => router.push("/"))
                          }}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
                        >
                          <UserIcon className="h-4 w-4" />
                          Sign Out
                        </button>
                      ) : (
                        <Link
                          href="/login"
                          onClick={() => setIsMenuOpen(false)}
                          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-signal)] px-4 py-3 text-sm font-semibold text-[var(--color-ink)]"
                        >
                          Sign In
                        </Link>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </motion.header>
  )
}
