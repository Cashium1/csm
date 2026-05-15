"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CourseActionButtonProps = {
  courseSlug: string;
  courseTitle: string;
  materialPdf: string;
  isFree: boolean;
  hasAccess: boolean;
};

type EnrollResponse = {
  message?: string;
};

export function CourseActionButton({ courseSlug, courseTitle, materialPdf, isFree, hasAccess }: CourseActionButtonProps) {
  const router = useRouter();
  const [hasLocalAccess, setHasLocalAccess] = useState(hasAccess);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFreeEnroll() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/courses/${courseSlug}/enroll`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as EnrollResponse;

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "무료 수강 신청을 처리하지 못했습니다.");
      setIsSubmitting(false);
      return;
    }

    setHasLocalAccess(true);
    setIsSubmitting(false);
    router.refresh();
  }

  if (hasLocalAccess) {
    return (
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setIsViewerOpen(true)}
          className="flex w-full justify-center rounded-full bg-zinc-950 px-5 py-4 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          수강하기
        </button>
        {isViewerOpen ? (
          <PdfMiniViewer
            courseTitle={courseTitle}
            materialPdf={materialPdf}
            onClose={() => setIsViewerOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  if (!isFree) {
    return (
      <Link
        href={`/checkout?course=${courseSlug}`}
        className="mt-5 flex w-full justify-center rounded-full bg-zinc-950 px-5 py-4 text-sm font-extrabold text-white transition hover:bg-zinc-800"
      >
        바로 결제하기
      </Link>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={handleFreeEnroll}
        disabled={isSubmitting}
        className="flex w-full justify-center rounded-full bg-[#ffd84d] px-5 py-4 text-sm font-black text-zinc-950 shadow-sm transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? "수강 신청 중..." : "무료로 수강하기"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
    </div>
  );
}

function PdfMiniViewer({
  courseTitle,
  materialPdf,
  onClose,
}: {
  courseTitle: string;
  materialPdf: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/70 px-4 py-6">
      <div className="flex h-full max-h-[760px] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-zinc-950">{courseTitle}</p>
            <p className="text-xs font-bold text-zinc-500">PDF 강의 자료</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={materialPdf}
              target="_blank"
              className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              새 창
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-zinc-950 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-zinc-800"
            >
              닫기
            </button>
          </div>
        </div>
        <iframe
          title={`${courseTitle} PDF 미니 뷰어`}
          src={`${materialPdf}#toolbar=0&navpanes=0`}
          className="min-h-0 flex-1 bg-zinc-100"
        />
      </div>
    </div>
  );
}
