const tossApiBase = "https://api.tosspayments.com";

// 클라이언트(브라우저)에서 결제창을 띄울 때 쓰는 공개 키
export function getTossClientKey() {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
}

// 서버에서 결제 승인 API를 호출할 때 쓰는 비밀 키 (절대 클라이언트 노출 금지)
export function getTossSecretKey() {
  return process.env.TOSS_SECRET_KEY ?? "";
}

export function isTossConfigured() {
  return Boolean(getTossClientKey() && getTossSecretKey());
}

type TossPaymentResult = {
  method?: string;
  approvedAt?: string;
  totalAmount?: number;
  status?: string;
  receipt?: { url?: string };
};

type ConfirmResult =
  | { ok: true; payment: TossPaymentResult }
  | { ok: false; code: string; message: string };

type CancelResult =
  | { ok: true; mocked: boolean; payment?: TossPaymentResult }
  | { ok: false; code: string; message: string };

// 운영 환경에서만 실제 토스 API를 호출합니다. (TOSS_SECRET_KEY가 있어야 함)
// 키가 없거나 TOSS_MOCK=1이면 mock 응답을 반환합니다.
export function shouldMockTossRefund(): boolean {
  if (process.env.TOSS_MOCK === "1") return true;
  return !process.env.TOSS_SECRET_KEY;
}

export async function cancelTossPayment(input: {
  paymentKey: string;
  cancelReason: string;
  cancelAmount?: number;
}): Promise<CancelResult> {
  if (shouldMockTossRefund()) {
    return { ok: true, mocked: true };
  }

  const secretKey = process.env.TOSS_SECRET_KEY!;
  const authorization = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  try {
    const response = await fetch(
      `${tossApiBase}/v1/payments/${encodeURIComponent(input.paymentKey)}/cancel`,
      {
        method: "POST",
        headers: { Authorization: authorization, "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelReason: input.cancelReason || "관리자 환불",
          ...(input.cancelAmount && input.cancelAmount > 0
            ? { cancelAmount: input.cancelAmount }
            : {}),
        }),
      },
    );
    const data = (await response.json().catch(() => ({}))) as TossPaymentResult & {
      code?: string;
      message?: string;
    };
    if (!response.ok) {
      return {
        ok: false,
        code: data.code ?? "CANCEL_FAILED",
        message: data.message ?? "환불 실행에 실패했습니다.",
      };
    }
    return { ok: true, mocked: false, payment: data };
  } catch (error) {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "네트워크 오류",
    };
  }
}

// 토스페이먼츠 결제 승인 API를 호출합니다.
// 결제창에서 받은 paymentKey/orderId/amount로 실제 결제를 확정합니다.
export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<ConfirmResult> {
  const secretKey = getTossSecretKey();

  if (!secretKey) {
    return {
      ok: false,
      code: "NOT_CONFIGURED",
      message: "토스 시크릿 키(TOSS_SECRET_KEY)가 설정되지 않았습니다.",
    };
  }

  // 시크릿 키를 사용자 이름으로 하는 Basic 인증 (비밀번호는 빈 값)
  const authorization = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  try {
    const response = await fetch(`${tossApiBase}/v1/payments/confirm`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json().catch(() => ({}))) as TossPaymentResult & {
      code?: string;
      message?: string;
    };

    if (!response.ok) {
      return {
        ok: false,
        code: data.code ?? "CONFIRM_FAILED",
        message: data.message ?? "결제 승인에 실패했습니다.",
      };
    }

    return { ok: true, payment: data };
  } catch (error) {
    return {
      ok: false,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "결제 승인 중 오류가 발생했습니다.",
    };
  }
}
