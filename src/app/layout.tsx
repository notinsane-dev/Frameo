import type { Metadata } from "next"
import { Cormorant_Garamond, JetBrains_Mono, Manrope } from "next/font/google"

import { AppProviders } from "@/components/providers/AppProviders"
import "./globals.css"

import { cn } from "@/lib/utils"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-playfair",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  title: {
    default: "CineAI — AI-Powered Movie Recommendations",
    template: "%s | CineAI",
  },
  description:
    "Discover your next favorite movie with AI-powered recommendations tailored to your taste and mood.",
  keywords: ["movies", "AI recommendations", "film discovery", "movie ratings", "watchlist"],
  authors: [{ name: "CineAI" }],
  creator: "CineAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "CineAI",
    title: "CineAI — AI-Powered Movie Recommendations",
    description:
      "Discover your next favorite movie with AI-powered recommendations tailored to your taste.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "CineAI" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CineAI — AI-Powered Movie Recommendations",
    description: "Discover your next favorite movie with AI-powered recommendations.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      className={cn(manrope.variable, cormorantGaramond.variable, jetBrainsMono.variable)}
    >
      <body className="bg-[#080808] font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
