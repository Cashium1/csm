import { notices } from "@/lib/data";

export default function NoticesPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">NOTICE</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">공지사항</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">캐쉬움 서비스 운영과 자료 업데이트 안내를 확인하세요.</p>

        <div className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
          {notices.map((notice) => (
            <article key={notice.title} className="p-5 transition hover:bg-[#fffdf2]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black text-zinc-950">{notice.title}</h2>
                <time className="text-sm font-bold text-zinc-500">{notice.date}</time>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{notice.summary}</p>
              <button type="button" className="mt-4 text-sm font-extrabold text-zinc-950 underline decoration-[#ffd84d] decoration-4">
                상세보기
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
