"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { POLICY_TYPES } from "@/lib/admin-constants";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

type Initial = { policyType: string; title: string; content: string } | null;

export function PolicyForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [policyType, setPolicyType] = useState(initial?.policyType ?? POLICY_TYPES[0].key);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [setActive, setSetActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setNotice({ text: "제목과 내용을 모두 입력해 주세요.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const response = await fetch("/api/admin/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyType, title, content, setActive }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }

    router.push("/admin/policies");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            정책 유형
            <select
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value)}
              className={inputCls}
            >
              {POLICY_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 self-end rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={setActive}
              onChange={(e) => setSetActive(e.target.checked)}
            />
            등록 즉시 활성 버전으로 설정
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            제목 <span className="text-red-500">*</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            내용 <span className="text-red-500">*</span>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              className={`${inputCls} font-mono text-xs leading-6`}
            />
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
          {isSubmitting ? "저장 중..." : "새 버전 등록"}
        </button>
      </div>
    </form>
  );
}
