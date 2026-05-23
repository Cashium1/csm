import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupons";
import { getCourse } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 결제 페이지에서 사용자가 입력한 쿠폰 코드를 서버에서 검증합니다.
// 모든 검증과 할인 계산은 서버에서 수행하며, 클라이언트 값을 신뢰하지 않습니다.
export async function POST(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ ok: false, message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { code?: unknown; courseSlug?: unknown }
    | null;
  const code = body && typeof body.code === "string" ? body.code.trim() : "";
  const courseSlug = body && typeof body.courseSlug === "string" ? body.courseSlug : "";

  if (!code) {
    return NextResponse.json({ ok: false, message: "쿠폰 코드를 입력해 주세요." }, { status: 400 });
  }

  const course = getCourse(courseSlug);
  if (!course) {
    return NextResponse.json({ ok: false, message: "강의 정보를 확인할 수 없습니다." }, { status: 400 });
  }

  const result = validateCoupon({
    code,
    userId: user.id,
    courseSlug,
    orderAmount: course.priceNumber,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    couponCode: result.coupon.code,
    couponName: result.coupon.name,
    discountAmount: result.discountAmount,
    finalAmount: result.finalAmount,
  });
}
