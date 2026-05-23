"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import { COURSE_GROUPS } from "@/lib/admin-constants";
import type { AdminCourse } from "@/lib/admin";

type Mode = "create" | "edit";

type FormState = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  groupKey: string;
  category: string;
  priceNumber: string;
  discountPrice: string;
  thumbnail: string;
  materialPdf: string;
  level: string;
  duration: string;
  recommendedFor: string;
  outcomes: string;
  isPublished: boolean;
  isOnSale: boolean;
};

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

function toState(course: AdminCourse | null): FormState {
  return {
    slug: course?.slug ?? "",
    title: course?.title ?? "",
    summary: course?.summary ?? "",
    description: course?.description ?? "",
    groupKey: course?.groupKey ?? COURSE_GROUPS[0].key,
    category: course?.category ?? "",
    priceNumber: course ? String(course.priceNumber) : "0",
    discountPrice: course ? String(course.discountPrice) : "0",
    thumbnail: course?.thumbnail ?? "",
    materialPdf: course?.materialPdf ?? "",
    level: course?.level ?? "입문",
    duration: course?.duration ?? "30분",
    recommendedFor: course?.recommendedFor ?? "",
    outcomes: course?.outcomes ?? "",
    isPublished: course?.isPublished ?? true,
    isOnSale: course?.isOnSale ?? true,
  };
}

export function CourseForm({ mode, initial }: { mode: Mode; initial: AdminCourse | null }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toState(initial));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const payload = {
      slug: form.slug,
      title: form.title,
      summary: form.summary,
      description: form.description,
      groupKey: form.groupKey,
      category: form.category,
      priceNumber: Math.max(0, Number(form.priceNumber) || 0),
      discountPrice: Math.max(0, Number(form.discountPrice) || 0),
      thumbnail: form.thumbnail,
      materialPdf: form.materialPdf,
      level: form.level,
      duration: form.duration,
      recommendedFor: form.recommendedFor,
      outcomes: form.outcomes,
      isPublished: form.isPublished,
      isOnSale: form.isOnSale,
    };

    const url =
      mode === "create" ? "/api/admin/courses" : `/api/admin/courses/${initial?.slug ?? ""}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setMessage(data.message ?? "저장에 실패했습니다.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { slug?: string };
    if (mode === "create") {
      router.push(`/admin/courses/${data.slug ?? form.slug}`);
    } else {
      router.refresh();
      setMessage("저장되었습니다.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">기본 정보</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            슬러그 (URL)
            <input
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              placeholder="ai-service-builder"
              disabled={mode === "edit"}
              className={`${inputCls} ${mode === "edit" ? "bg-zinc-100 text-zinc-500" : ""}`}
            />
            <span className="text-xs font-normal text-zinc-500">
              영문 소문자/숫자/하이픈. 생성 후에는 변경할 수 없습니다.
            </span>
          </label>
          <label className={labelCls}>
            제목
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            한 줄 소개
            <input
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            상세 설명
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">분류 / 학습 정보</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            대분류
            <select
              value={form.groupKey}
              onChange={(e) => update("groupKey", e.target.value)}
              className={inputCls}
            >
              {COURSE_GROUPS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            세부 카테고리
            <input
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              placeholder="예: AI 콘텐츠 제작"
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            난이도
            <select
              value={form.level}
              onChange={(e) => update("level", e.target.value)}
              className={inputCls}
            >
              <option value="입문">입문</option>
              <option value="기초">기초</option>
              <option value="실전">실전</option>
            </select>
          </label>
          <label className={labelCls}>
            예상 학습 시간
            <input
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="예: 45분"
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            추천 대상 (줄 단위로 입력)
            <textarea
              value={form.recommendedFor}
              onChange={(e) => update("recommendedFor", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            학습 후 결과 (줄 단위로 입력)
            <textarea
              value={form.outcomes}
              onChange={(e) => update("outcomes", e.target.value)}
              rows={3}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">가격 / 자료</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            가격(원)
            <input
              type="number"
              min={0}
              value={form.priceNumber}
              onChange={(e) => update("priceNumber", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            할인 가격(원, 0이면 미적용)
            <input
              type="number"
              min={0}
              value={form.discountPrice}
              onChange={(e) => update("discountPrice", e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            썸네일 이미지 URL
            <input
              value={form.thumbnail}
              onChange={(e) => update("thumbnail", e.target.value)}
              placeholder="/course-thumbnails/xxx.webp"
              className={inputCls}
            />
          </label>
          <label className={`${labelCls} md:col-span-2`}>
            PDF 파일 URL
            <input
              value={form.materialPdf}
              onChange={(e) => update("materialPdf", e.target.value)}
              placeholder="/course-materials/xxx.pdf 또는 https://..."
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">공개 / 판매 상태</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
            />
            공개 (사용자에게 보임)
          </label>
          <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={form.isOnSale}
              onChange={(e) => update("isOnSale", e.target.checked)}
            />
            판매중 (결제 가능)
          </label>
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
