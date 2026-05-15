"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CourseReview } from "@/lib/course-reviews";

type ReviewFormProps = {
  courseSlug: string;
  initialReview: CourseReview | null;
};

type ReviewErrors = {
  rating?: string;
  content?: string;
};

type ReviewResponse = {
  message?: string;
  errors?: ReviewErrors;
};

export function ReviewForm({ courseSlug, initialReview }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [content, setContent] = useState(initialReview?.content ?? "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrors({});

    const response = await fetch(`/api/courses/${courseSlug}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating, content }),
    });

    const data = (await response.json().catch(() => ({}))) as ReviewResponse;

    if (!response.ok) {
      setMessage(data.message ?? "후기를 저장하지 못했습니다.");
      setErrors(data.errors ?? {});
      setIsSubmitting(false);
      return;
    }

    setMessage(initialReview ? "후기가 수정되었습니다." : "후기가 등록되었습니다.");
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-zinc-950">{initialReview ? "내 후기 수정" : "후기 작성"}</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">결제한 강의에 대해 솔직한 학습 경험을 남겨주세요.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-extrabold text-zinc-700">
          평점
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-bold outline-none transition focus:border-[#f2c230]"
          >
            {[5, 4, 3, 2, 1].map((score) => (
              <option key={score} value={score}>
                {score}점
              </option>
            ))}
          </select>
        </label>
      </div>

      {errors.rating ? <p className="mt-3 text-sm font-bold text-red-600">{errors.rating}</p> : null}

      <label className="mt-4 grid gap-2 text-sm font-bold text-zinc-700">
        후기 내용
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          maxLength={800}
          placeholder="어떤 점이 도움이 되었는지, 수강 전 기대와 비교해 어땠는지 적어주세요."
          className="resize-none rounded-lg border border-zinc-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#f2c230]"
        />
      </label>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-red-600">{errors.content ?? ""}</span>
        <span className="shrink-0 font-bold text-zinc-400">{content.trim().length} / 800</span>
      </div>

      {message ? (
        <p
          className={`mt-4 rounded-lg p-3 text-sm font-bold ${
            errors.content || errors.rating
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full rounded-full bg-zinc-950 px-5 py-4 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400 sm:w-fit"
      >
        {isSubmitting ? "저장 중..." : initialReview ? "후기 수정하기" : "후기 등록하기"}
      </button>
    </form>
  );
}
