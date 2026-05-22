export default function Loading() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="h-9 w-48 rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-40 rounded bg-zinc-200" />
        <p className="mt-8 text-sm font-bold text-zinc-400">불러오는 중...</p>
        <div className="mt-3 space-y-5">
          {[0, 1, 2, 3].map((card) => (
            <div key={card} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="h-5 w-28 rounded bg-zinc-100" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="h-10 rounded bg-zinc-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
