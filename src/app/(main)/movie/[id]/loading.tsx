export default function Loading() {
  return (
    <div className="space-y-10 pb-12">
      <div className="h-[70vh] skeleton" />
      <div className="mx-auto w-full max-w-7xl space-y-10 px-6">
        <section className="space-y-4">
          <div className="h-8 w-64 rounded-lg skeleton" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-32 w-24 flex-none rounded-xl skeleton" />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-8 w-56 rounded-lg skeleton" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 w-48 flex-none rounded-xl skeleton" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
