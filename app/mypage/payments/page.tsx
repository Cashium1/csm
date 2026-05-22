import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatWon } from "@/lib/format";
import { getPaymentsForUser } from "@/lib/payments";
import { PaymentStatusBadge } from "./payment-status-badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const payments = getPaymentsForUser(user.id);

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-1 text-sm font-extrabold text-zinc-500 transition hover:text-zinc-950"
        >
          ← 마이페이지
        </Link>
        <p className="mt-4 text-sm font-extrabold text-[#b77900]">PAYMENTS</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">결제 내역</h1>
        <p className="mt-3 text-base leading-7 text-zinc-600">
          구매하신 강의의 결제 내역입니다. 각 항목의 상세보기에서 주문·결제·환불 정보를 확인할 수 있습니다.
        </p>

        {payments.length ? (
          <ul className="mt-8 space-y-4">
            {payments.map((payment) => (
              <li key={payment.id}>
                <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[#f2c230] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-500">{payment.orderNumber}</p>
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                  <h2 className="mt-2 text-lg font-black text-zinc-950">{payment.productName}</h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="font-bold text-zinc-500">결제일</dt>
                      <dd className="mt-1 font-bold text-zinc-900">{formatDateTime(payment.paidAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-zinc-500">결제 수단</dt>
                      <dd className="mt-1 font-bold text-zinc-900">{payment.paymentMethod}</dd>
                    </div>
                    <div>
                      <dt className="font-bold text-zinc-500">결제 금액</dt>
                      <dd className="mt-1 font-black text-zinc-900">{formatWon(payment.finalPrice)}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
                    <Link
                      href={`/mypage/payments/${payment.id}`}
                      className="inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
                    >
                      상세보기
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-zinc-500">결제 내역이 없습니다.</p>
            <Link
              href="/courses"
              className="mt-4 inline-flex rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-extrabold text-zinc-950 transition hover:bg-[#f2c230]"
            >
              강의 둘러보기
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
