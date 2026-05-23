"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CouponRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const isActive = status === "active";

  async function toggle() {
    const next = isActive ? "inactive" : "active";
    if (
      isActive &&
      !window.confirm("이 쿠폰을 비활성화하시겠습니까? 사용자에게 더 이상 적용되지 않습니다.")
    ) {
      return;
    }
    setIsBusy(true);
    const response = await fetch(`/api/admin/coupons/${id}`, {
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
      onClick={toggle}
      disabled={isBusy}
      className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
          : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500"
      }`}
    >
      {isActive ? "비활성화" : "활성화"}
    </button>
  );
}
