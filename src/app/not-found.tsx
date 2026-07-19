"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { fadeUp } from "@/lib/animations"

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] px-6 py-20">
      <div className="absolute inset-0 grid grid-cols-3 gap-4 opacity-20 blur-2xl">
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-gradient-to-br from-[#C9A84C]/30 via-white/5 to-transparent" />
        ))}
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center"
      >
        <div className="gold-gradient-text font-playfair text-[7rem] leading-none md:text-[10rem]">404</div>
        <h1 className="mt-4 font-playfair text-4xl text-white md:text-6xl">Scene Not Found</h1>
        <p className="mt-4 max-w-xl text-white/50">
          Looks like this page doesn&apos;t exist. The movie or profile you requested may be unavailable.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/" className="rounded-full bg-[#C9A84C] px-6 py-3 font-semibold text-[#080808]">
            Go Home
          </Link>
          <Link href="/explore" className="rounded-full border border-white/20 px-6 py-3 font-semibold text-white">
            Explore Movies
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
