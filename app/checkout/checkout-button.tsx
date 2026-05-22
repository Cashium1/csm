"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type RequestPaymentParams = {
  method: string;
  amount: { currency: string; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
  customerName?: string;
};

type TossPaymentMethods = {
  requestPayment: (params: RequestPaymentParams) => Promise<void>;
};

type TossPaymentsInstance = {
  payment: (options: { customerKey: string }) => TossPaymentMethods;
};

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

let tossSdkPromise: Promise<void> | null = null;

// 토스페이먼츠 v2 SDK 스크립트를 한 번만 로드합니다.
function loadTossSdk(): Promise<void> {
  if (typeof window !== "undefined" && window.TossPayments) {
    return Promise.resolve();
  }

  if (!tossSdkPromise) {
    tossSdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.tosspayments.com/v2/standard";
      script.onload = () => resolve();
      script.onerror = () => {
        tossSdkPromise = null;
        reject(new Error("결제 모듈을 불러오지 못했습니다."));
      };
      document.head.appendChild(script);
    });
  }

  return tossSdkPromise;
}

type CreateOrderResponse = {
  message?: string;
  orderId?: string;
  orderName?: string;
  amount?: number;
  customerKey?: string;
  customerEmail?: string;
  customerName?: string;
};

export function CheckoutButton({
  courseSlug,
  clientKey,
}: {
  courseSlug: string;
  clientKey: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleCheckout() {
    setIsSubmitting(true);
    setMessage("");

    try {
      // 1) 서버에서 주문을 생성하고 확정 금액을 받습니다.
      const response = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = (await response.json().catch(() => ({}))) as CreateOrderResponse;

      if (!response.ok || !data.orderId || typeof data.amount !== "number") {
        setMessage(data.message ?? "결제를 시작하지 못했습니다.");
        setIsSubmitting(false);
        return;
      }

      // 2) 토스페이먼츠 결제창을 호출합니다.
      await loadTossSdk();

      if (!window.TossPayments) {
        setMessage("결제 모듈을 불러오지 못했습니다.");
        setIsSubmitting(false);
        return;
      }

      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: data.customerKey ?? "ANONYMOUS" });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: data.amount },
        orderId: data.orderId,
        orderName: data.orderName ?? "강의 결제",
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
      });
      // 결제창 호출에 성공하면 토스페이먼츠 페이지로 이동합니다.
    } catch (error) {
      // 사용자가 결제를 취소했거나 처리 중 오류가 발생한 경우
      setMessage(error instanceof Error ? error.message : "결제가 취소되었습니다.");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isSubmitting}
        className="mt-5 w-full rounded-full bg-[#ffd84d] px-5 py-4 text-sm font-black text-zinc-950 shadow-sm transition hover:bg-[#f2c230] disabled:cursor-not-allowed disabled:bg-zinc-300"
      >
        {isSubmitting ? "결제 진행 중..." : "결제하기"}
      </button>
      {message ? <p className="mt-3 text-sm font-bold text-red-600">{message}</p> : null}
    </>
  );
}
