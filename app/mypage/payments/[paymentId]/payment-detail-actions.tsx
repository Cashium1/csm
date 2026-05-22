"use client";

import { useState } from "react";

/** 환불 요청 버튼 — 클릭 시 요청 접수 안내를 인라인으로 표시합니다. */
export function RefundRequestButton() {
  const [requested, setRequested] = useState(false);

  if (requested) {
    return (
      <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
        환불 요청이 접수되었습니다. 영업일 기준 3일 이내에 등록하신 이메일로 처리 결과를 안내드립니다.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRequested(true)}
      className="mt-3 inline-flex rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-extrabold text-red-600 transition hover:border-red-400 hover:bg-red-50"
    >
      환불 요청
    </button>
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
