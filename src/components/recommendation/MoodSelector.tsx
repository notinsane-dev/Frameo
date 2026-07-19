"use client"

import { motion } from "framer-motion"
import { listItem, staggerContainerFast } from "@/lib/animations"

type MoodSelectorProps = {
  selected: string
  onChange: (mood: string) => void
}

const moods = [
  { id: "feel-good", emoji: "😊", label: "Feel Good" },
  { id: "emotional", emoji: "😢", label: "Emotional" },
  { id: "thrilling", emoji: "😱", label: "Thrilling" },
  { id: "funny", emoji: "😂", label: "Funny" },
  { id: "thoughtful", emoji: "🤔", label: "Thought-provoking" },
  { id: "relaxing", emoji: "😴", label: "Relaxing" },
  { id: "intense", emoji: "🔥", label: "Intense" },
  { id: "romantic", emoji: "💕", label: "Romantic" },
]

export function MoodSelector({ selected, onChange }: MoodSelectorProps) {
  return (
    <motion.div
      className="flex flex-wrap gap-3"
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
    >
      {moods.map((mood) => (
        <motion.button
          key={mood.id}
          variants={listItem}
          onClick={() => onChange(mood.id)}
          whileTap={{ scale: 0.95 }}
          className={`rounded-full border px-4 py-2 font-dm-sans font-medium transition-all duration-300 ${
            selected === mood.id
              ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]"
              : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white/90"
          }`}
        >
          <span className="mr-2">{mood.emoji}</span>
          {mood.label}
        </motion.button>
      ))}
    </motion.div>
  )
}
