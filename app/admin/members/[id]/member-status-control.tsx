"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "active" | "blocked" | "deleted";

const OPTIONS: Array<{ value: Status; label: string; tone: string }> = [
  { value: "active", label: "정상 (활성)", tone: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { value: "blocked", label: "차단", tone: "border-red-300 bg-red-50 text-red-700" },
  { value: "deleted", label: "탈퇴", tone: "border-zinc-300 bg-zinc-100 text-zinc-700" },
];

export function MemberStatusControl({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(
    currentStatus === "blocked" || currentStatus === "deleted" ? currentStatus : "active",
  );
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function apply(next: Status) {
    if (next === status) return;
    if (next === "deleted" && !window.confirm("이 회원을 탈퇴 처리하시겠습니까? 데이터는 유지됩니다.")) {
      return;
    }
    if (next === "blocked" && !window.confirm("이 회원을 차단하시겠습니까? 즉시 로그아웃됩니다.")) {
      return;
    }

    setIsBusy(true);
    setNotice(null);

    const response = await fetch(`/api/admin/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    setIsBusy(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "처리에 실패했습니다.", tone: "error" });
      return;
    }

    setStatus(next);
    setNotice({ text: "계정 상태가 변경되었습니다.", tone: "ok" });
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-2">
      {OPTIONS.map((opt) => {
        const isActive = opt.value === status;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => apply(opt.value)}
            disabled={isBusy || isActive}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed ${
              isActive
                ? `${opt.tone} opacity-100`
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
            }`}
          >
            <span>{opt.label}</span>
            {isActive ? <span className="text-[10px]">현재</span> : null}
          </button>
        );
      })}
      {notice ? (
        <p
          className={`text-xs font-bold ${
            notice.tone === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
