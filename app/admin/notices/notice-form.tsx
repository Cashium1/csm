"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import type { AdminNotice } from "@/lib/admin";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

export function NoticeForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: AdminNotice | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const url = mode === "create" ? "/api/admin/notices" : `/api/admin/notices/${initial?.id ?? ""}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, isPublished, isPinned }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(data.message ?? "저장에 실패했습니다.");
      return;
    }

    if (mode === "create") {
      router.push("/admin/notices");
    } else {
      router.refresh();
      setMessage("저장되었습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <label className={labelCls}>
            제목
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            내용
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="문단을 나누려면 빈 줄로 구분해 주세요."
              className={inputCls}
            />
            <span className="text-xs font-normal text-zinc-500">
              빈 줄(↵↵)로 문단을 구분합니다. 사용자 화면에서 단락별로 표시됩니다.
            </span>
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              공개
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              상단 고정
            </label>
          </div>
        </div>
      </section>

      {message ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm font-bold text-zinc-700">
          {message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "저장 중..." : mode === "create" ? "등록하기" : "저장하기"}
        </button>
      </div>
    </form>
  );
}
