export default function Loading() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="mt-6 h-9 w-40 rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-72 max-w-full rounded bg-zinc-200" />
        <p className="mt-8 text-sm font-bold text-zinc-400">불러오는 중...</p>
        <div className="mt-3 space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="h-4 w-40 rounded bg-zinc-100" />
              <div className="mt-3 h-6 w-2/3 rounded bg-zinc-100" />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="h-10 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
