"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FaqRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleDelete() {
    if (!window.confirm("이 FAQ를 삭제하시겠습니까?")) return;
    setIsBusy(true);
    const response = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
    setIsBusy(false);
    if (response.ok) {
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      alert(data.message ?? "삭제에 실패했습니다.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isBusy}
      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      삭제
    </button>
  );
}
