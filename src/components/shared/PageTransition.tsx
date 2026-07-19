"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { fadeUp } from "@/lib/animations"

type PageTransitionProps = {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      {children}
    </motion.div>
  )
}
