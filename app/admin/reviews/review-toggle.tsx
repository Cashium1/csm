"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReviewToggle({
  id,
  status,
}: {
  id: string;
  status: "visible" | "hidden";
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleToggle() {
    const next = status === "visible" ? "hidden" : "visible";
    setIsBusy(true);
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
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
      onClick={handleToggle}
      disabled={isBusy}
      className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        status === "visible"
          ? "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500"
      }`}
    >
      {status === "visible" ? "숨김 처리" : "노출 처리"}
    </button>
  );
}
