export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-ink)]">
      <section className="border-b border-[var(--color-border)] px-6 pb-10 pt-10 md:px-12 md:pb-14 md:pt-14">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-3 w-20 rounded-full bg-[var(--color-signal-muted)]" />
          <div className="h-12 w-48 max-w-full rounded-xl skeleton" />
          <div className="h-4 w-80 max-w-full rounded-lg skeleton" />
          <div className="mt-6 h-12 max-w-2xl rounded-full border border-[var(--color-border)] skeleton" />
        </div>
      </section>
      <div className="border-b border-[var(--color-border)] px-6 py-3 md:px-12">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-10 w-24 flex-none rounded-full border border-[var(--color-border)] skeleton"
            />
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-12">
        <div className="mb-8 h-8 w-40 rounded-lg skeleton" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] rounded-xl border border-[var(--color-border)] skeleton"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
