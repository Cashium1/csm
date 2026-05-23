import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { updateOrderRefund, type RefundAction } from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isValidAction(value: unknown): value is RefundAction {
  return value === "request" || value === "complete" || value === "memo";
}

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
  return NextResponse.json({ ok: true });
}
