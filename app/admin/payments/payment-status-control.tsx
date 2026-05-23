"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

type Props = {
  orderId: string;
  currentStatus: string;
  statuses: readonly string[];
  labels: Record<string, string>;
};

const statusColor: Record<string, string> = {
  paid: "border-emerald-300 bg-emerald-50 text-emerald-700",
  failed: "border-red-300 bg-red-50 text-red-700",
  refund_requested: "border-amber-300 bg-amber-50 text-amber-800",
  refunded: "border-zinc-300 bg-zinc-100 text-zinc-700",
  pending: "border-zinc-300 bg-white text-zinc-700",
  canceled: "border-zinc-300 bg-zinc-100 text-zinc-500",
};

export function PaymentStatusControl({ orderId, currentStatus, statuses, labels }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(currentStatus);
  const [isBusy, setIsBusy] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === value) return;
    setIsBusy(true);
    const response = await fetch(`/api/admin/payments/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setIsBusy(false);
    if (response.ok) {
      setValue(next);
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      alert(data.message ?? "상태 변경에 실패했습니다.");
    }
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={isBusy}
      className={`rounded-full border px-2.5 py-1 text-xs font-extrabold outline-none transition disabled:opacity-50 ${
        statusColor[value] ?? "border-zinc-300 bg-white text-zinc-700"
      }`}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {labels[s] ?? s}
        </option>
      ))}
    </select>
  );
}
