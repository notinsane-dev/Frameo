"use client"

import { Sparkles } from "lucide-react"
import { useState } from "react"

import { AIRecommendationPanel } from "@/components/recommendation/AIRecommendationPanel"
import { GenreFilter } from "@/components/recommendation/GenreFilter"
import { MoodSelector } from "@/components/recommendation/MoodSelector"
import { AuthGuard } from "@/components/shared/AuthGuard"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { trpc } from "@/lib/trpc/client"
import { motion } from "framer-motion"

export default function RecommendationsPage() {
  const [mood, setMood] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isManualLoading, setIsManualLoading] = useState(false)

  const { data: genresData } = trpc.movies.getGenres.useQuery()

  const {
    data: recommendationsData,
    refetch: refetchRecommendations,
    isLoading,
    error,
  } = trpc.recommendations.getRecommendations.useQuery(
    { mood: mood || undefined, genre: selectedGenre || undefined, limit: 10 },
    { enabled: false }
  )

  const genres = genresData?.genres || []
  const recommendations = recommendationsData || []

  const handleGenerate = async () => {
    if (!mood && !selectedGenre) {
      return
    }

    setHasGenerated(true)
    setIsManualLoading(true)

    try {
      await refetchRecommendations()
    } finally {
      setIsManualLoading(false)
    }
  }

  const handleRegenerate = () => {
    handleGenerate()
  }

  const handleChangePreferences = () => {
    setHasGenerated(false)
    setMood("")
    setSelectedGenre("")
    setIsManualLoading(false)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#080808] pt-8 pb-16">
        <section className="mx-auto mb-16 max-w-4xl px-6 text-center">
          <motion.div
            className="mb-6 flex justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-12 w-12 text-[#C9A84C]" />
          </motion.div>

          <h1 className="mb-4 font-playfair text-5xl font-bold text-white">
            Your Personal AI Curator
          </h1>
          <p className="text-lg text-white/60">
            Tell us how you're feeling and we'll find the perfect movie for you
          </p>
        </section>

        <section className="mx-auto mb-12 max-w-4xl px-6">
          <div className="space-y-8">
            <div>
              <label className="mb-4 block font-dm-sans text-white/80">
                How are you feeling?
              </label>
              <MoodSelector selected={mood} onChange={setMood} />
            </div>

            <div>
              <label className="mb-4 block font-dm-sans text-white/80">
                Any genre preference?
              </label>
              <GenreFilter
                selected={selectedGenre}
                onChange={setSelectedGenre}
                genres={genres}
              />
            </div>

            <div className="flex justify-center pt-4">
              <button
                onClick={handleGenerate}
                disabled={isManualLoading || isLoading || (!mood && !selectedGenre)}
                className="group relative inline-flex items-center gap-2 rounded-lg bg-[#C9A84C] px-8 py-3 font-dm-sans font-semibold text-[#080808] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:opacity-50 hover:bg-[#D4B961]"
              >
                {isManualLoading || isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate My Recommendations
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {hasGenerated && (
          <section className="mx-auto max-w-7xl px-6">
            {error ? (
              <div className="mb-8 rounded-lg border border-red-500/50 bg-red-900/10 p-6">
                <p className="text-red-400">
                  {error.message || "Failed to generate recommendations"}
                </p>
                <button
                  onClick={handleRegenerate}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-dm-sans font-semibold text-white transition-all duration-300 hover:bg-red-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <AIRecommendationPanel
                  recommendations={recommendations}
                  isLoading={isManualLoading || isLoading}
                />

                {!isLoading && !isManualLoading && recommendations.length > 0 && (
                  <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                    <button
                      onClick={handleRegenerate}
                      className="rounded-lg border border-[#C9A84C] px-6 py-2 font-dm-sans font-semibold text-[#C9A84C] transition-all duration-300 hover:bg-[#C9A84C]/10"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleChangePreferences}
                      className="rounded-lg px-6 py-2 font-dm-sans font-semibold text-white/50 transition-all duration-300 hover:text-white"
                    >
                      Change preferences
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {!hasGenerated && !isManualLoading && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="text-white/10">
              <Sparkles className="h-20 w-20" />
            </div>
            <p className="text-center text-xl text-white/30">
              Your recommendations will appear here
            </p>
            <p className="text-center text-sm text-white/20">
              Select a mood and hit generate to start
            </p>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
