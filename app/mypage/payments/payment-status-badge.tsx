import type { PaymentStatus } from "@/lib/payments";

const STATUS_STYLES: Record<PaymentStatus, { label: string; className: string }> = {
  paid: { label: "결제 완료", className: "bg-emerald-100 text-emerald-700" },
  pending: { label: "결제 대기", className: "bg-amber-100 text-amber-800" },
  failed: { label: "결제 실패", className: "bg-red-100 text-red-700" },
  refunded: { label: "환불 완료", className: "bg-zinc-200 text-zinc-600" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${style.className}`}
    >
      {style.label}
    </span>
  );
}
