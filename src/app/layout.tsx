import type { Metadata } from "next"
import { JetBrains_Mono, Outfit, Space_Grotesk } from "next/font/google"

import { AppProviders } from "@/components/providers/AppProviders"
import "./globals.css"

import { cn } from "@/lib/utils"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  title: {
    default: "Frameo — Decide what to watch next",
    template: "%s | Frameo",
  },
  description:
    "Personalized movie picks with AI taste matching, streaming-aware recommendations, and Watch Together nights.",
  keywords: ["movies", "AI recommendations", "film discovery", "movie ratings", "watchlist", "Frameo"],
  authors: [{ name: "Frameo" }],
  creator: "Frameo",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Frameo",
    title: "Frameo — Decide what to watch next",
    description:
      "Personalized movie picks with AI taste matching — tonight's frame, not tomorrow's list.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Frameo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frameo — Decide what to watch next",
    description: "Personalized movie picks with AI taste matching.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/frameo.webp", type: "image/webp" }],
    apple: [{ url: "/frameo.webp", type: "image/webp" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(outfit.variable, spaceGrotesk.variable, jetBrainsMono.variable)}
    >
      <body className="bg-[var(--color-ink)] font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
