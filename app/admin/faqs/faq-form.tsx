"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { FAQ_CATEGORIES } from "@/lib/admin-constants";
import type { Faq } from "@/lib/admin-extra2";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

export function FaqForm({ mode, initial }: { mode: "create" | "edit"; initial: Faq | null }) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.category ?? FAQ_CATEGORIES[0]);
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(initial?.displayOrder ?? 0));
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) {
      setNotice({ text: "질문을 입력해 주세요.", tone: "error" });
      return;
    }
    if (!answer.trim()) {
      setNotice({ text: "답변을 입력해 주세요.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const payload = {
      category,
      question,
      answer,
      displayOrder: Number(displayOrder) || 0,
      isPublished,
    };
    const url = mode === "create" ? "/api/admin/faqs" : `/api/admin/faqs/${initial?.id}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }

    if (mode === "create") {
      router.push("/admin/faqs");
    } else {
      router.refresh();
      setNotice({ text: "저장되었습니다.", tone: "ok" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            카테고리
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {FAQ_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            노출 순서
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            질문 <span className="text-red-500">*</span>
            <input
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            답변 <span className="text-red-500">*</span>
            <textarea
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={8}
              className={inputCls}
            />
          </label>
          <label className="md:col-span-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            공개 상태
          </label>
        </div>
      </section>

      {notice ? (
        <p
          className={`rounded-lg p-3 text-sm font-bold ${
            notice.tone === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
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
