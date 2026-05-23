"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";

export function AnswerForm({
  inquiryId,
  initialAnswer,
}: {
  inquiryId: string;
  initialAnswer: string;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState(initialAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answer.trim()) {
      setNotice({ text: "답변 내용을 입력해 주세요.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }

    setNotice({ text: "답변이 저장되었습니다.", tone: "ok" });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        placeholder="고객에게 전달할 답변 내용을 입력하세요."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]"
      />
      {notice ? (
        <p
          className={`text-xs font-bold ${
            notice.tone === "ok" ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {notice.text}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "저장 중..." : "답변 저장 (답변완료 처리)"}
        </button>
      </div>
    </form>
  );
}
