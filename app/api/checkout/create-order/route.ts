import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { isTossConfigured } from "@/lib/toss";
import { validateCoupon, recordCouponUsage } from "@/lib/coupons";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 결제 전 주문을 생성하고, 결제창에 전달할 정보를 반환합니다.
export async function POST(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 결제할 수 있습니다." }, { status: 401 });
  }

  if (user.status === "blocked") {
    return NextResponse.json(
      { message: "차단된 계정은 결제할 수 없습니다. 관리자에게 문의해 주세요." },
      { status: 403 },
    );
  }
  if (user.status === "deleted") {
    return NextResponse.json({ message: "사용할 수 없는 계정입니다." }, { status: 403 });
  }

  if (!isTossConfigured()) {
    return NextResponse.json(
      { message: "결제 키가 설정되지 않았습니다. 관리자에게 문의해 주세요." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { courseSlug?: unknown; couponCode?: unknown }
    | null;
  const courseSlug = body && typeof body.courseSlug === "string" ? body.courseSlug : "";
  const couponCode =
    body && typeof body.couponCode === "string" && body.couponCode.trim()
      ? body.couponCode.trim()
      : "";

  if (!courseSlug) {
    return NextResponse.json({ message: "강의 정보가 없습니다." }, { status: 400 });
  }

  const result = createOrder(user.id, courseSlug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  let finalAmount = result.order.amount;
  let appliedCoupon: { id: string; code: string; discountAmount: number } | null = null;

  // 쿠폰이 적용되면 서버에서 재검증해 금액을 깎고 사용량을 기록합니다.
  if (couponCode) {
    const couponResult = validateCoupon({
      code: couponCode,
      userId: user.id,
      courseSlug,
      orderAmount: result.order.amount,
    });
    if (!couponResult.ok) {
      // 쿠폰이 무효하면 결제 자체를 막아 안전하게 처리합니다.
      return NextResponse.json({ message: couponResult.message }, { status: 400 });
    }
    finalAmount = couponResult.finalAmount;
    appliedCoupon = {
      id: couponResult.coupon.id,
      code: couponResult.coupon.code,
      discountAmount: couponResult.discountAmount,
    };

    // 주문 금액을 쿠폰 적용가로 갱신 + 메모에 쿠폰 정보 저장
    getDatabase()
      .prepare(
        `UPDATE orders SET amount = ?, admin_memo = COALESCE(admin_memo, '') || ?, updated_at = ? WHERE id = ?`,
      )
      .run(
        finalAmount,
        `[쿠폰] ${appliedCoupon.code} (-${appliedCoupon.discountAmount.toLocaleString("ko-KR")}원)\n`,
        new Date().toISOString(),
        result.order.id,
      );

    recordCouponUsage({
      couponId: appliedCoupon.id,
      couponCode: appliedCoupon.code,
      userId: user.id,
      courseId: courseSlug,
      orderId: result.order.id,
      discountAmount: appliedCoupon.discountAmount,
    });
  }

  return NextResponse.json({
    orderId: result.order.id,
    orderName: result.order.orderName,
    amount: finalAmount,
    originalAmount: result.order.amount,
    appliedCoupon: appliedCoupon
      ? { code: appliedCoupon.code, discountAmount: appliedCoupon.discountAmount }
      : null,
    customerKey: user.id,
    customerEmail: user.email,
    customerName: user.name,
  });
}
