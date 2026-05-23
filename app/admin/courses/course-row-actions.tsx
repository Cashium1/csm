"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ToggleKind = "published" | "onSale";

type Props =
  | { slug: string; kind: ToggleKind; value: boolean }
  | { slug: string; kind: "delete" };

export function CourseRowActions(props: Props) {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);

  async function toggle(field: "isPublished" | "isOnSale", next: boolean) {
    setIsBusy(true);
    const response = await fetch(`/api/admin/courses/${props.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: next }),
    });
    setIsBusy(false);
    if (response.ok) {
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      alert(data.message ?? "처리에 실패했습니다.");
    }
  }

  async function handleDelete() {
    const ok = window.confirm(
      "이 강의를 삭제하시겠습니까?\n구매 이력이 있는 경우 비공개+판매중지로 자동 전환됩니다.",
    );
    if (!ok) return;
    setIsBusy(true);
    const response = await fetch(`/api/admin/courses/${props.slug}`, {
      method: "DELETE",
    });
    setIsBusy(false);
    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as { softDeleted?: boolean };
      if (data.softDeleted) {
        alert("구매 이력이 있어 비공개+판매중지로 전환했습니다.");
      }
      router.refresh();
    } else {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      alert(data.message ?? "삭제에 실패했습니다.");
    }
  }

  if (props.kind === "delete") {
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

  const field = props.kind === "published" ? "isPublished" : "isOnSale";
  const next = !props.value;
  const label = props.value ? "ON" : "OFF";
  const color = props.value
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300";

  return (
    <button
      type="button"
      onClick={() => toggle(field, next)}
      disabled={isBusy}
      className={`inline-flex w-14 justify-center rounded-full px-2 py-1 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${color}`}
    >
      {label}
    </button>
  );
}
