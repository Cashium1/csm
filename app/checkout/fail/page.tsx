import Link from "next/link";
import { getOrderById } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FailPageProps = {
  searchParams: Promise<{ code?: string; message?: string; orderId?: string }>;
};

export default async function CheckoutFailPage({ searchParams }: FailPageProps) {
  const { code, message, orderId } = await searchParams;
  const order = orderId ? getOrderById(orderId) : null;
  const retryHref = order ? `/checkout?course=${order.courseSlug}` : "/courses";

  return (
    <section className="bg-zinc-50 py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            ⚠️
          </div>
          <h1 className="mt-5 text-2xl font-black text-zinc-950">결제에 실패했습니다</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            {message ?? "결제가 취소되었거나 처리 중 문제가 발생했습니다."}
          </p>
          {code ? <p className="mt-2 text-xs font-bold text-zinc-400">오류 코드: {code}</p> : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={retryHref}
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
            >
              다시 시도하기
            </Link>
            <Link
              href="/courses"
              className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              강의 목록
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
