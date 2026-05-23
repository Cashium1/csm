import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { updateOrderStatus, VALID_ORDER_STATUSES, type AdminOrderStatus } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function isValidStatus(value: unknown): value is AdminOrderStatus {
  return typeof value === "string" && (VALID_ORDER_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!body || !isValidStatus(body.status)) {
    return NextResponse.json({ message: "올바른 상태값을 보내주세요." }, { status: 400 });
  }

  const result = updateOrderStatus(id, body.status);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
