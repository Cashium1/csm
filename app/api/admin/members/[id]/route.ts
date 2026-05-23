import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { isValidMemberStatus, updateMemberStatus } from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  if (id === admin.id) {
    return NextResponse.json(
      { message: "본인 계정의 상태는 변경할 수 없습니다." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  if (!body || !isValidMemberStatus(body.status)) {
    return NextResponse.json(
      { message: "올바른 상태값을 보내주세요. (active/blocked/deleted)" },
      { status: 400 },
    );
  }

  const result = updateMemberStatus(id, body.status);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
