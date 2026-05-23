import { getActivePolicy } from "@/lib/admin-extra2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  const policy = getActivePolicy("privacy");
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">POLICY</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">개인정보처리방침</h1>
        {policy ? (
          <article className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">{policy.title}</h2>
            <p className="mt-1 text-xs text-zinc-500">v{policy.version}</p>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {policy.content}
            </p>
          </article>
        ) : (
          <p className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            아직 활성화된 개인정보처리방침이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
