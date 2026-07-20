export default function Loading() {
  return (
    <div className="space-y-10 pb-12">
      <div className="relative h-[70dvh] overflow-hidden bg-[var(--color-ink-elevated)]">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-transparent to-transparent" />
        <div className="absolute bottom-12 left-6 space-y-3 md:left-12">
          <div className="h-4 w-20 rounded-full bg-[var(--color-signal-muted)]" />
          <div className="h-12 w-72 max-w-[70vw] rounded-xl skeleton" />
          <div className="h-4 w-48 rounded-lg skeleton" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-6">
        <section className="space-y-4">
          <div className="h-8 w-40 rounded-lg skeleton" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 w-24 flex-none rounded-xl border border-[var(--color-border)] skeleton"
              />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-8 w-56 rounded-lg skeleton" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 w-48 flex-none rounded-xl border border-[var(--color-border)] skeleton"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
