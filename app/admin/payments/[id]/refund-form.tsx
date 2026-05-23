"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  status: string;
  amount: number;
  defaultReason: string;
  defaultMemo: string;
};

export function RefundForm({
  orderId,
  status,
  amount,
  defaultReason,
  defaultMemo,
}: Props) {
  const router = useRouter();
  const [reason, setReason] = useState(defaultReason);
  const [memo, setMemo] = useState(defaultMemo);
  const [refundAmount, setRefundAmount] = useState(String(amount));
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function callApi(action: "request" | "complete" | "memo") {
    setIsBusy(true);
    setNotice(null);

    const response = await fetch(`/api/admin/payments/${orderId}/refund`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        refundReason: reason || null,
        refundAmount: Number(refundAmount) || amount,
        adminMemo: memo || null,
      }),
    });

    setIsBusy(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "처리에 실패했습니다.", tone: "error" });
      return;
    }

    setNotice({
      text:
        action === "memo"
          ? "메모가 저장되었습니다."
          : action === "request"
            ? "환불 요청 상태로 변경되었습니다."
            : "환불 완료 처리되었습니다. 해당 강의의 수강 권한이 비활성화되었습니다.",
      tone: "ok",
    });
    router.refresh();
  }

  const canRequest = status === "paid";
  const canComplete = status === "paid" || status === "refund_requested";

  return (
    <div className="mt-5 space-y-4 border-t border-zinc-100 pt-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1.5 text-xs font-bold text-zinc-700">
          환불 금액(원)
          <input
            type="number"
            min={0}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#f2c230]"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-bold text-zinc-700 sm:col-span-2">
          환불 사유
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="환불 사유를 입력하세요"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#f2c230]"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-xs font-bold text-zinc-700">
        관리자 메모
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="내부 운영용 메모입니다."
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#f2c230]"
        />
      </label>

      {notice ? (
        <p
          className={`text-xs font-bold ${
            notice.tone === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => callApi("memo")}
          disabled={isBusy}
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          메모만 저장
        </button>
        <button
          type="button"
          onClick={() => callApi("request")}
          disabled={isBusy || !canRequest}
          title={!canRequest ? "결제완료 상태에서만 환불 요청할 수 있습니다." : undefined}
          className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-extrabold text-amber-800 transition hover:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          환불 요청으로 변경
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("환불 완료 처리하시겠습니까?\n해당 회원의 강의 수강 권한이 비활성화됩니다.")) {
              return;
            }
            callApi("complete");
          }}
          disabled={isBusy || !canComplete}
          title={!canComplete ? "결제완료/환불요청 상태에서만 환불 처리할 수 있습니다." : undefined}
          className="rounded-full bg-red-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          환불 완료 처리
        </button>
      </div>
    </div>
  );
}
