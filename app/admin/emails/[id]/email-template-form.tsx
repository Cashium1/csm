"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import type { EmailTemplate } from "@/lib/admin-extra2";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

const PLACEHOLDERS = [
  "{{userName}}",
  "{{courseTitle}}",
  "{{amount}}",
  "{{orderId}}",
  "{{inquiryTitle}}",
  "{{answer}}",
];

export function EmailTemplateForm({ initial }: { initial: EmailTemplate }) {
  const router = useRouter();
  const [templateName, setTemplateName] = useState(initial.templateName);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const response = await fetch(`/api/admin/emails/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateName, subject, body, isActive }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }
    setNotice({ text: "저장되었습니다.", tone: "ok" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          <label className={labelCls}>
            템플릿명
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            메일 제목
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            본문
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className={`${inputCls} font-mono text-xs leading-6`}
            />
            <span className="text-xs font-normal text-zinc-500">
              사용 가능한 변수: {PLACEHOLDERS.join(", ")}
            </span>
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            활성 상태 (해당 이벤트에서 이 템플릿으로 메일을 발송)
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
          {isSubmitting ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
}
