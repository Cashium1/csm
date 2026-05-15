"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CourseCartButtonProps = {
  courseSlug: string;
  initialIsCarted: boolean;
};

type CartResponse = {
  message?: string;
};

export function CourseCartButton({ courseSlug, initialIsCarted }: CourseCartButtonProps) {
  const router = useRouter();
  const [isCarted, setIsCarted] = useState(initialIsCarted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCart() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/courses/${courseSlug}/cart`, {
      method: isCarted ? "DELETE" : "POST",
    });
    const data = (await response.json().catch(() => ({}))) as CartResponse;

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "강의 담기 상태를 변경하지 못했습니다.");
      setIsSubmitting(false);
      return;
    }

    setIsCarted((value) => !value);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleCart}
        disabled={isSubmitting}
        className="flex w-full justify-center rounded-full border border-zinc-300 bg-white px-5 py-4 text-sm font-extrabold text-zinc-900 transition hover:border-zinc-950 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
      >
        {isSubmitting ? "처리 중..." : isCarted ? "담은 강의에서 빼기" : "강의 담기"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
    </div>
  );
}
