import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import { createPolicyVersion } from "@/lib/admin-extra2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function asBool(v: unknown) {
  return v === true || v === "true" || v === 1;
}

export async function POST(request: NextRequest) {
  const admin = requirePermissionFromRequest(request, "manage:policies");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });

  const policyType = asString(body.policyType);
  if (!policyType) return NextResponse.json({ message: "정책 유형이 필요합니다." }, { status: 400 });

  const result = createPolicyVersion(policyType, {
    title: asString(body.title),
    content: asString(body.content),
    setActive: asBool(body.setActive),
  });

  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "create",
    targetType: "policy",
    targetId: result.id,
    targetName: `${policyType} v${result.version}`,
    description: `${policyType} 정책 새 버전(v${result.version})을 등록했습니다.`,
    afterData: { policyType, title: asString(body.title), version: result.version, setActive: asBool(body.setActive) },
  });

  return NextResponse.json({ ok: true, id: result.id, version: result.version }, { status: 201 });
}
