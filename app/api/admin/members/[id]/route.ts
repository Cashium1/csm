import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import {
  getAdminMemberDetail,
  isValidMemberStatus,
  updateMemberStatus,
} from "@/lib/admin-extra";
import { logAdminAction } from "@/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const MEMBER_STATUS_LABEL: Record<string, string> = {
  active: "활성",
  blocked: "차단",
  deleted: "탈퇴",
};

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

  const before = getAdminMemberDetail(id);

  const result = updateMemberStatus(id, body.status);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 404 });
  }

  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: "status_change",
    targetType: "member",
    targetId: id,
    targetName: before?.base.name ?? null,
    description: `회원 상태를 '${MEMBER_STATUS_LABEL[body.status] ?? body.status}'(으)로 변경했습니다.`,
    beforeData: before ? { status: before.base.status } : undefined,
    afterData: { status: body.status },
  });

  return NextResponse.json({ ok: true });
}
