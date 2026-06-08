import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { dispatchEventEmail } from "@/lib/notifications";
import { requestRefundByUser } from "@/lib/orders";
import { getSiteSettings } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ paymentId: string }> };

// 사용자가 본인 결제 건에 대해 환불을 요청합니다.
export async function POST(request: NextRequest, { params }: Ctx) {
  const user = getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  if (user.status === "blocked" || user.status === "deleted") {
    return NextResponse.json({ message: "사용할 수 없는 계정입니다." }, { status: 403 });
  }

  const { paymentId } = await params;
  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
  const reason = body && typeof body.reason === "string" ? body.reason : "";

  const result = requestRefundByUser(user.id, paymentId, reason);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  // 알림 발송은 실패하더라도 환불 요청 자체는 성공으로 처리합니다.
  try {
    // 1) 사용자에게 환불 요청 접수 안내
    await dispatchEventEmail("refund_requested", user.email, {
      userName: user.name,
      courseTitle: result.order.orderName,
      orderId: result.order.id,
      amount: result.order.amount,
    });

    // 2) 관리자에게 새 환불 요청 알림 (고객센터 이메일이 설정된 경우)
    const adminEmail = getSiteSettings().customerEmail;
    if (adminEmail) {
      await dispatchEventEmail("admin_new_refund", adminEmail, {
        userName: user.name,
        courseTitle: result.order.orderName,
        orderId: result.order.id,
        amount: result.order.amount,
      });
    }
  } catch {
    // 알림 실패는 무시 (요청은 이미 접수됨)
  }

  return NextResponse.json({ ok: true });
}
