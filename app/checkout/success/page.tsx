import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { getOrderById, markOrderFailed, markOrderPaid, type Order } from "@/lib/orders";
import { purchaseCourse } from "@/lib/purchases";
import { confirmTossPayment } from "@/lib/toss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
};

type ConfirmationResult =
  | { status: "success"; order: Order }
  | { status: "error"; message: string; order: Order | null };

// 토스 결제 승인 처리: 본인 확인 → 금액 검증 → 승인 API 호출 → 주문/수강권한 반영
async function processConfirmation(
  paymentKey: string | undefined,
  orderId: string | undefined,
  amount: string | undefined,
): Promise<ConfirmationResult> {
  if (!paymentKey || !orderId || !amount) {
    return { status: "error", message: "결제 정보가 올바르지 않습니다.", order: null };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { status: "error", message: "로그인이 필요합니다.", order: null };
  }

  const order = getOrderById(orderId);

  if (!order) {
    return { status: "error", message: "주문 정보를 찾을 수 없습니다.", order: null };
  }

  if (order.userId !== user.id) {
    return { status: "error", message: "본인의 주문만 확인할 수 있습니다.", order: null };
  }

  // 이미 승인된 주문(새로고침 등)은 그대로 완료 처리합니다.
  if (order.status === "paid") {
    return { status: "success", order };
  }

  // 결제 금액 위변조 검증: 토스가 전달한 금액과 서버 주문 금액을 대조합니다.
  if (Number(amount) !== order.amount) {
    markOrderFailed(orderId, "결제 금액이 주문 금액과 일치하지 않습니다.");
    return { status: "error", message: "결제 금액이 일치하지 않아 결제를 취소했습니다.", order };
  }

  const confirmation = await confirmTossPayment({ paymentKey, orderId, amount: order.amount });

  if (!confirmation.ok) {
    markOrderFailed(orderId, confirmation.message);
    return { status: "error", message: confirmation.message, order };
  }

  markOrderPaid(orderId, {
    paymentKey,
    method: confirmation.payment.method ?? "",
    receiptUrl: confirmation.payment.receipt?.url ?? "",
    approvedAt: confirmation.payment.approvedAt ?? new Date().toISOString(),
  });

  // 강의 수강 권한을 부여합니다.
  purchaseCourse(user.id, order.courseSlug);

  return { status: "success", order: getOrderById(orderId) ?? order };
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { paymentKey, orderId, amount } = await searchParams;
  const result = await processConfirmation(paymentKey, orderId, amount);

  if (result.status === "error") {
    const retryHref = result.order ? `/checkout?course=${result.order.courseSlug}` : "/courses";

    return (
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
              ⚠️
            </div>
            <h1 className="mt-5 text-2xl font-black text-zinc-950">결제를 완료하지 못했습니다</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{result.message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                href={retryHref}
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
              >
                다시 시도하기
              </Link>
              <Link
                href="/courses"
                className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
              >
                강의 목록
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { order } = result;
  const course = getCourse(order.courseSlug);

  return (
    <section className="bg-zinc-50 py-16">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl">
            ✅
          </div>
          <h1 className="mt-5 text-2xl font-black text-zinc-950">결제가 완료되었습니다</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            이제 마이페이지와 강의 페이지에서 학습 자료를 확인할 수 있습니다.
          </p>

          <dl className="mt-6 grid gap-2 rounded-lg bg-zinc-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-zinc-500">상품</dt>
              <dd className="text-right font-extrabold text-zinc-900">{order.orderName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-zinc-500">결제 금액</dt>
              <dd className="text-right font-extrabold text-zinc-900">
                {order.amount.toLocaleString("ko-KR")}원
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 font-bold text-zinc-500">주문번호</dt>
              <dd className="wrap-break-word text-right font-bold text-zinc-600">{order.id}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {course ? (
              <Link
                href={`/courses/${course.slug}`}
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
              >
                강의 보러 가기
              </Link>
            ) : null}
            <Link
              href="/mypage"
              className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              마이페이지
            </Link>
            {order.receiptUrl ? (
              <a
                href={order.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
              >
                영수증 보기
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
