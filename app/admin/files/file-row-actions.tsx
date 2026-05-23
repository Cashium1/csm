"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FileRowActions({
  id,
  hasCourse,
  courseTitle,
}: {
  id: string;
  hasCourse: boolean;
  courseTitle: string;
}) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function handleDeactivate() {
    const message = hasCourse
      ? `⚠️ 이 파일은 "${courseTitle}" 강의에 연결돼 있습니다.\n비활성화하면 해당 강의의 자료 열람이 영향을 받을 수 있습니다.\n계속하시겠습니까?`
      : "이 파일을 비활성화하시겠습니까?";
    if (!window.confirm(message)) return;

    setIsBusy(true);
    const response = await fetch(`/api/admin/files/${id}`, { method: "DELETE" });
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
      onClick={handleDeactivate}
      disabled={isBusy}
      className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-extrabold text-red-600 transition hover:border-red-400 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      비활성화
    </button>
  );
}
