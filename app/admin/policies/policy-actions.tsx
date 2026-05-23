"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PolicyActivateButton({
  id,
  typeLabel,
}: {
  id: string;
  typeLabel: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleActivate() {
    if (!window.confirm(`이 버전을 '${typeLabel}'의 활성 버전으로 설정하시겠습니까?`)) return;
    setIsBusy(true);
    const response = await fetch(`/api/admin/policies/${id}/activate`, { method: "PATCH" });
    setIsBusy(false);
    if (response.ok) {
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      alert(data.message ?? "처리에 실패했습니다.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      disabled={isBusy}
      className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700 transition hover:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      활성화
    </button>
  );
}
