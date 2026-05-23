import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin";
import { getAdminOrderDetail } from "@/lib/admin-extra";
import { RefundForm } from "./refund-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
function fmtDT(iso: string | null) {
  return iso ? dateTimeFormatter.format(new Date(iso)) : "-";
}
function formatWon(n: number | null) {
  if (n === null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getAdminOrderDetail(id);
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/payments"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 결제 관리로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">결제 상세</h1>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-700">
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-black text-zinc-950">주문 정보</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="주문번호" value={<span className="break-all font-mono text-xs">{order.id}</span>} />
            <Row label="상품(강의)" value={order.orderName} />
            <Row label="금액" value={formatWon(order.amount)} />
            <Row label="결제 수단" value={order.method || "-"} />
            <Row label="결제 시각" value={fmtDT(order.approvedAt)} />
            <Row label="주문 생성" value={fmtDT(order.createdAt)} />
            <Row
              label="paymentKey"
              value={
                order.paymentKey ? (
                  <span className="break-all font-mono text-xs">{order.paymentKey}</span>
                ) : (
                  "-"
                )
              }
            />
            <Row
              label="영수증"
              value={
                order.receiptUrl ? (
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-extrabold text-zinc-700 hover:underline"
                  >
                    영수증 보기 ↗
                  </a>
                ) : (
                  "-"
                )
              }
            />
          </dl>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">구매 회원</h2>
            <p className="mt-2 font-extrabold text-zinc-900">
              <Link href={`/admin/members/${order.userId}`} className="hover:underline">
                {order.userName}
              </Link>
            </p>
            <p className="text-xs text-zinc-500">{order.userEmail}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">강의</h2>
            <p className="mt-2 font-extrabold text-zinc-900">
              <Link href={`/admin/courses/${order.courseSlug}`} className="hover:underline">
                {order.orderName}
              </Link>
            </p>
            <p className="text-xs text-zinc-500">{order.courseSlug}</p>
          </div>
        </aside>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">환불 정보</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Row label="환불 상태" value={refundStatusLabel(order.refundStatus)} />
          <Row label="환불 금액" value={formatWon(order.refundAmount)} />
          <Row label="환불 요청일" value={fmtDT(order.refundRequestedAt)} />
          <Row label="환불 처리일" value={fmtDT(order.refundedAt)} />
          <Row label="환불 사유" value={order.refundReason || "-"} />
          <Row label="관리자 메모" value={order.adminMemo || "-"} />
        </dl>
        <RefundForm
          orderId={order.id}
          status={order.status}
          amount={order.amount}
          defaultReason={order.refundReason ?? ""}
          defaultMemo={order.adminMemo ?? ""}
        />
      </section>
    </div>
  );
}

function refundStatusLabel(status: string) {
  if (status === "requested") return "환불 요청됨";
  if (status === "completed") return "환불 완료";
  return "-";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold text-zinc-900">{value}</dd>
    </div>
  );
}
