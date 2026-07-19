export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      <div className="h-12 w-full rounded-xl skeleton" />
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-10 w-24 flex-none rounded-full skeleton" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-[2/3] rounded-xl skeleton" />
        ))}
      </div>
    </div>
  )
}
