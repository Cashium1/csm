import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { setReviewStatus } from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!body || (body.status !== "visible" && body.status !== "hidden")) {
    return NextResponse.json({ message: "노출 상태값이 올바르지 않습니다." }, { status: 400 });
  }

  const result = setReviewStatus(id, body.status);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
