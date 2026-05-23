import Link from "next/link";
import { listAdminOrders, ORDER_STATUS_LABELS, VALID_ORDER_STATUSES } from "@/lib/admin";
import { PaymentStatusControl } from "./payment-status-control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function AdminPaymentsPage() {
  const orders = listAdminOrders();
  const paidTotal = orders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amount, 0);
  const refundRequests = orders.filter((o) => o.status === "refund_requested").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">결제 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          전체 {orders.length}건 · 결제완료 합계 {formatWon(paidTotal)} · 환불 요청 {refundRequests}건
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">주문번호</th>
                <th className="px-5 py-3 text-left">회원</th>
                <th className="px-5 py-3 text-left">강의</th>
                <th className="px-5 py-3 text-right">금액</th>
                <th className="px-5 py-3 text-left">결제 수단</th>
                <th className="px-5 py-3 text-left">상태</th>
                <th className="px-5 py-3 text-left">결제일</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-zinc-400">
                    결제 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/payments/${o.id}`}
                        className="font-mono text-xs text-zinc-700 hover:underline"
                      >
                        {o.id.slice(0, 18)}…
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-extrabold text-zinc-900">{o.userName}</p>
                      <p className="text-xs text-zinc-500">{o.userEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">{o.orderName}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {formatWon(o.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{o.method || "-"}</td>
                    <td className="px-5 py-3.5">
                      <PaymentStatusControl
                        orderId={o.id}
                        currentStatus={o.status}
                        statuses={VALID_ORDER_STATUSES}
                        labels={ORDER_STATUS_LABELS}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateTimeFormatter.format(new Date(o.approvedAt ?? o.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/payments/${o.id}`}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
