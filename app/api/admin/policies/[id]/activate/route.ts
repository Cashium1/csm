import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import { activatePolicy, getAdminPolicy } from "@/lib/admin-extra2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:policies");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminPolicy(id);
  if (!before) return NextResponse.json({ message: "정책을 찾을 수 없습니다." }, { status: 404 });

  const result = activatePolicy(id);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "enable",
    targetType: "policy",
    targetId: id,
    targetName: `${before.policyType} v${before.version}`,
    description: "정책 버전을 활성화했습니다.",
    beforeData: { isActive: before.isActive },
    afterData: { isActive: true },
  });

  return NextResponse.json({ ok: true });
}
