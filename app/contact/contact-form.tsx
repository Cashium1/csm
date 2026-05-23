"use client";

import { SyntheticEvent, useState } from "react";

const INQUIRY_TYPE_OPTIONS = [
  { key: "course", label: "강의 문의" },
  { key: "payment", label: "결제 문의" },
  { key: "refund", label: "환불 문의" },
  { key: "account", label: "계정 문의" },
  { key: "general", label: "기타 문의" },
];

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#f2c230]";

export function ContactForm({
  defaultName,
  defaultEmail,
  isLoggedIn,
}: {
  defaultName: string;
  defaultEmail: string;
  isLoggedIn: boolean;
}) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [type, setType] = useState("general");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [relatedCourseTitle, setRelatedCourseTitle] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        type,
        title,
        content,
        relatedCourseTitle: relatedCourseTitle || null,
        relatedOrderId: relatedOrderId || null,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "문의 접수에 실패했습니다.", tone: "error" });
      return;
    }

    setNotice({
      text: "문의가 접수되었습니다. 확인 후 답변드리겠습니다.",
      tone: "ok",
    });
    setTitle("");
    setContent("");
    setRelatedCourseTitle("");
    setRelatedOrderId("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
    >
      {!isLoggedIn ? (
        <p className="rounded-lg bg-[#fff9dc] p-3 text-xs font-bold text-amber-800">
          로그인하지 않아도 문의는 보낼 수 있지만, 회원 정보가 함께 저장되면 더 빠르게 처리해 드립니다.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          이름
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          이메일
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          문의 유형
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
            {INQUIRY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelCls}>
          관련 강의 (선택)
          <input
            value={relatedCourseTitle}
            onChange={(e) => setRelatedCourseTitle(e.target.value)}
            placeholder="강의 제목"
            className={inputCls}
          />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          관련 주문번호 (선택)
          <input
            value={relatedOrderId}
            onChange={(e) => setRelatedOrderId(e.target.value)}
            placeholder="order_…"
            className={inputCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        제목
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className={labelCls}>
        내용
        <textarea
          required
          rows={8}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={inputCls}
        />
      </label>

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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-[#ffd84d] px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? "전송 중..." : "문의 보내기"}
        </button>
      </div>
    </form>
  );
}
