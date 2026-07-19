"use client"

import { useMemo } from "react"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"

import { useRatings } from "@/hooks/useRatings"
import { useWatchlist } from "@/hooks/useWatchlist"

const COLORS = ["#C9A84C", "#E8C97A", "#8E6F28", "#FFFFFF"]

export default function StatsTab() {
  const { ratings } = useRatings()
  const { watchlist } = useWatchlist()

  const distribution = useMemo(
    () => [
      { name: "0.5-3.5", value: ratings.filter((item) => item.rating < 4).length },
      { name: "4.0-6.5", value: ratings.filter((item) => item.rating >= 4 && item.rating < 7).length },
      { name: "7.0-8.5", value: ratings.filter((item) => item.rating >= 7 && item.rating < 9).length },
      { name: "9.0-10", value: ratings.filter((item) => item.rating >= 9).length },
    ],
    [ratings],
  )

  const totalRated = ratings.length
  const chartData = distribution.filter((bucket) => bucket.value > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass-card rounded-3xl p-6">
        <h3 className="mb-4 font-playfair text-2xl text-white">Rating Distribution</h3>
        <div className="h-72">
          {totalRated > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const count = Number(value ?? 0)
                    return [`${count} movie${count === 1 ? "" : "s"}`, "Count"]
                  }}
                  contentStyle={{
                    background: "rgba(8, 8, 8, 0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/50">
              Rate movies to see your distribution
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {distribution.map((bucket, index) => (
            <div key={bucket.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-white/70">{bucket.name}</span>
              </div>
              <span className="text-white">
                {bucket.value}
                {totalRated > 0 ? ` (${Math.round((bucket.value / totalRated) * 100)}%)` : ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card rounded-3xl p-6">
          <p className="text-sm text-white/40">Movies on Watchlist</p>
          <p className="mt-2 font-playfair text-4xl text-white">{watchlist.length}</p>
        </div>
        <div className="glass-card rounded-3xl p-6">
          <p className="text-sm text-white/40">Movies Rated</p>
          <p className="mt-2 font-playfair text-4xl text-white">{totalRated}</p>
        </div>
      </div>
    </div>
  )
}
