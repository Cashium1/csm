import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createOrder } from "@/lib/orders";
import { isTossConfigured } from "@/lib/toss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 결제 전 주문을 생성하고, 결제창에 전달할 정보를 반환합니다.
export async function POST(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 결제할 수 있습니다." }, { status: 401 });
  }

  if (!isTossConfigured()) {
    return NextResponse.json(
      { message: "결제 키가 설정되지 않았습니다. 관리자에게 문의해 주세요." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { courseSlug?: unknown } | null;
  const courseSlug = body && typeof body.courseSlug === "string" ? body.courseSlug : "";

  if (!courseSlug) {
    return NextResponse.json({ message: "강의 정보가 없습니다." }, { status: 400 });
  }

  const result = createOrder(user.id, courseSlug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    orderId: result.order.id,
    orderName: result.order.orderName,
    amount: result.order.amount,
    customerKey: user.id,
    customerEmail: user.email,
    customerName: user.name,
  });
}
