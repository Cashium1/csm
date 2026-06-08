"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 환불 요청 버튼 — 사유를 입력해 실제 환불 요청을 서버에 전송합니다. */
export function RefundRequestButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setStatus("submitting");
    setError(null);
    try {
      const response = await fetch(`/api/mypage/payments/${paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setError(data.message ?? "환불 요청에 실패했습니다.");
        setStatus("idle");
        return;
      }
      setStatus("done");
      // 서버 컴포넌트(환불 정보 카드)를 새로고침해 최신 상태를 반영합니다.
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
        환불 요청이 접수되었습니다. 영업일 기준 3일 이내에 등록하신 이메일로 처리 결과를 안내드립니다.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <label htmlFor="refund-reason" className="text-xs font-bold text-zinc-500">
        환불 사유 (선택)
      </label>
      <textarea
        id="refund-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={3}
        maxLength={500}
        placeholder="환불을 요청하시는 사유를 입력해 주세요."
        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-950"
      />
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={status === "submitting"}
        className="mt-2 inline-flex rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-extrabold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? "요청 중…" : "환불 요청"}
      </button>
    </div>
  );
}

/** 영수증 보기(인쇄) / 거래명세서 다운로드 버튼 */
export function ReceiptActions({
  statementText,
  statementFileName,
}: {
  statementText: string;
  statementFileName: string;
}) {
  function handleViewReceipt() {
    window.print();
  }

  function handleDownloadStatement() {
    const blob = new Blob([statementText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = statementFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleViewReceipt}
        className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
      >
        영수증 보기
      </button>
      <button
        type="button"
        onClick={handleDownloadStatement}
        className="inline-flex rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
      >
        거래명세서 보기
      </button>
    </div>
  );
}
