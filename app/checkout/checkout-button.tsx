"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CheckoutButtonProps = {
  courseSlug: string;
};

type PurchaseResponse = {
  message?: string;
};

export function CheckoutButton({ courseSlug }: CheckoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePurchase() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch(`/api/courses/${courseSlug}/purchase`, {
      method: "POST",
    });
    const data = (await response.json().catch(() => ({}))) as PurchaseResponse;

    if (response.status === 401) {
      router.push("/login");
      return;
    }

    if (!response.ok) {
      setMessage(data.message ?? "결제를 완료하지 못했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/courses/${courseSlug}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isSubmitting}
        className="mt-5 w-full rounded-full bg-[#ffd84d] px-5 py-4 text-sm font-black text-zinc-950 shadow-sm transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? "결제 처리 중..." : "결제하기"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
    </>
  );
}
