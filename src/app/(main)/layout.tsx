import { Suspense } from "react"

import { ClaimInviteBootstrap } from "@/components/friends/ClaimInviteBootstrap"
import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { PageTransition } from "@/components/shared/PageTransition"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="ink-grain min-h-screen bg-[var(--color-ink)] text-[var(--color-text)]">
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      <ClaimInviteBootstrap />
      <main className="pt-16">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  )
}
