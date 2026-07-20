"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { useEffect, useState, type ReactNode } from "react"

import { ToastProvider } from "@/components/shared/ToastProvider"
import { setLenisInstance } from "@/lib/lenis"
import { getQueryClient, getTrpcClient, trpc } from "@/lib/trpc/client"

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger)

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => getQueryClient())
  const [trpcClient] = useState(() => getTrpcClient())

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Let modals / overflow panels keep native wheel scrolling
      prevent: (node) =>
        node instanceof HTMLElement &&
        (node.hasAttribute("data-lenis-prevent") ||
          node.closest("[data-lenis-prevent]") != null),
    })

    setLenisInstance(lenis)

    // Integrate Lenis with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update)
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    return () => {
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000)
      })
      setLenisInstance(null)
      lenis.destroy()
    }
  }, [])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    </trpc.Provider>
  )
}
