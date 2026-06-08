import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { getAdminOrderDetail, updateOrderRefund, type RefundAction } from "@/lib/admin-extra";
import { logAdminAction } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isValidAction(value: unknown): value is RefundAction {
  return value === "request" || value === "complete" || value === "memo";
}

const REFUND_ACTION_LOG: Record<RefundAction, { actionType: string; description: string }> = {
  request: { actionType: "refund_request", description: "환불을 요청 접수 처리했습니다." },
  complete: { actionType: "refund_complete", description: "환불을 완료 처리했습니다." },
  memo: { actionType: "update", description: "주문 메모를 수정했습니다." },
};

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !isValidAction(body.action)) {
    return NextResponse.json(
      { message: "올바른 action이 필요합니다. (request/complete/memo)" },
      { status: 400 },
    );
  }

  const result = updateOrderRefund(id, {
    action: body.action,
    refundReason:
      typeof body.refundReason === "string"
        ? body.refundReason
        : body.refundReason === null
          ? undefined
          : undefined,
    refundAmount:
      typeof body.refundAmount === "number" && Number.isFinite(body.refundAmount)
        ? body.refundAmount
        : undefined,
    adminMemo:
      typeof body.adminMemo === "string"
        ? body.adminMemo
        : body.adminMemo === null
          ? undefined
          : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 404 });
  }

  const order = getAdminOrderDetail(id);
  const logInfo = REFUND_ACTION_LOG[body.action];
  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: logInfo.actionType,
    targetType: "order",
    targetId: id,
    targetName: order?.orderName ?? null,
    description: logInfo.description,
  });

  return NextResponse.json({ ok: true });
}
