import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import { getAdminOrderDetail, updateOrderRefund } from "@/lib/admin-extra";
import { cancelTossPayment } from "@/lib/toss";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// 토스페이먼츠 실제 환불 API를 호출하고, 성공 시 주문 상태와 수강권을 갱신합니다.
export async function POST(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:refunds");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const order = getAdminOrderDetail(id);
  if (!order) return NextResponse.json({ message: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (!order.paymentKey) {
    return NextResponse.json(
      { message: "이 주문에는 결제 키가 없어 토스 환불을 실행할 수 없습니다." },
      { status: 400 },
    );
  }
  if (order.status === "refunded") {
    return NextResponse.json({ message: "이미 환불 완료된 주문입니다." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as {
    refundReason?: unknown;
    refundAmount?: unknown;
  } | null;
  const refundReason =
    body && typeof body.refundReason === "string" ? body.refundReason.trim() : "";
  const refundAmount =
    body && typeof body.refundAmount === "number" ? Math.floor(body.refundAmount) : order.amount;

  if (refundAmount <= 0 || refundAmount > order.amount) {
    return NextResponse.json(
      { message: `환불 금액은 1원 이상 ${order.amount.toLocaleString("ko-KR")}원 이하여야 합니다.` },
      { status: 400 },
    );
  }

  // 토스 API 호출 (mock 모드면 즉시 성공)
  const tossResult = await cancelTossPayment({
    paymentKey: order.paymentKey,
    cancelReason: refundReason || "관리자 환불",
    cancelAmount: refundAmount === order.amount ? undefined : refundAmount,
  });

  if (!tossResult.ok) {
    // 실패 시 admin_memo에 오류 저장
    const db = getDatabase();
    db
      .prepare(
        `UPDATE orders SET admin_memo = ?, updated_at = ? WHERE id = ?`,
      )
      .run(
        `[환불 실행 실패] ${tossResult.code}: ${tossResult.message}`,
        new Date().toISOString(),
        id,
      );

    logAdminAction({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      },
      actionType: "refund_execute",
      targetType: "order",
      targetId: id,
      targetName: order.orderName,
      description: `토스 환불 API 호출에 실패했습니다. (${tossResult.code})`,
      beforeData: { status: order.status, refundStatus: order.refundStatus },
      afterData: { error: tossResult.message, code: tossResult.code },
    });

    return NextResponse.json(
      { message: `환불에 실패했습니다: ${tossResult.message}`, code: tossResult.code },
      { status: 502 },
    );
  }

  // 성공: 주문 환불 완료 처리 + 수강권 비활성화
  updateOrderRefund(id, {
    action: "complete",
    refundReason,
    refundAmount,
  });

  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: "refund_execute",
    targetType: "order",
    targetId: id,
    targetName: order.orderName,
    description: tossResult.mocked
      ? `[MOCK] 토스 환불 API 호출 시뮬레이션 성공 (${refundAmount.toLocaleString("ko-KR")}원)`
      : `토스 환불 API 호출 성공 (${refundAmount.toLocaleString("ko-KR")}원)`,
    beforeData: { status: order.status, refundStatus: order.refundStatus },
    afterData: { status: "refunded", refundStatus: "completed", refundAmount },
  });

  return NextResponse.json({ ok: true, mocked: tossResult.mocked });
}
