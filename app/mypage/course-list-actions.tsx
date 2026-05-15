"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type CourseActionProps = {
  courseSlug: string;
  isFree?: boolean;
};

type ApiResponse = {
  message?: string;
};

export function CartCourseActions({ courseSlug, isFree = false }: CourseActionProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleRemove() {
    setIsRemoving(true);
    setMessage("");

    const response = await fetch(`/api/courses/${courseSlug}/cart`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "담은 강의에서 제거하지 못했습니다.");
      setIsRemoving(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={isFree ? `/courses/${courseSlug}` : `/checkout?course=${courseSlug}`}
        className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-zinc-800"
      >
        {isFree ? "무료 수강하기" : "바로 결제하기"}
      </Link>
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        {isRemoving ? "제거 중..." : "담기 취소"}
      </button>
      {message ? <p className="basis-full text-sm font-bold text-red-600">{message}</p> : null}
    </div>
  );
}

export function LearningCourseActions({ courseSlug }: CourseActionProps) {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleComplete() {
    setIsCompleting(true);
    setMessage("");

    const response = await fetch(`/api/courses/${courseSlug}/complete`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "강의를 완료 처리하지 못했습니다.");
      setIsCompleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/courses/${courseSlug}`}
        className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-zinc-800"
      >
        수강하기
      </Link>
      <button
        type="button"
        onClick={handleComplete}
        disabled={isCompleting}
        className="inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950 disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        {isCompleting ? "완료 처리 중..." : "수강 완료"}
      </button>
      {message ? <p className="basis-full text-sm font-bold text-red-600">{message}</p> : null}
    </div>
  );
}
