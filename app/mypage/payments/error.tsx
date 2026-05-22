"use client";

import Link from "next/link";

export default function PaymentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-zinc-950">결제 정보를 불러오지 못했습니다.</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            일시적인 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-extrabold text-zinc-950 transition hover:bg-[#f2c230]"
            >
              다시 시도
            </button>
            <Link
              href="/mypage"
              className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              마이페이지로
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
