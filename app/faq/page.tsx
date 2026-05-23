import { listPublicFaqs } from "@/lib/admin-extra2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function FaqPage() {
  const faqs = listPublicFaqs();
  const grouped: Record<string, typeof faqs> = {};
  for (const f of faqs) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }
  const categories = Object.keys(grouped);

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">FAQ</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">자주 묻는 질문</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          궁금하신 내용이 있다면 아래 항목을 먼저 확인해 주세요. 해결되지 않는 문의는 문의하기에서
          남겨주시면 빠르게 답변드립니다.
        </p>

        {faqs.length === 0 ? (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {categories.map((cat) => (
              <section key={cat}>
                <h2 className="text-lg font-black text-zinc-950">{cat}</h2>
                <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
                  {grouped[cat].map((f) => (
                    <details key={f.id} className="group p-5">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-extrabold text-zinc-900 marker:hidden">
                        <span>{f.question}</span>
                        <span className="shrink-0 text-zinc-400 group-open:rotate-180 transition">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                        {f.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
