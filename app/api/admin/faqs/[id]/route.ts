import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import { deleteFaq, getAdminFaq, updateFaq, type FaqInput } from "@/lib/admin-extra2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function asBool(v: unknown) {
  return v === true || v === "true" || v === 1;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:faqs");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminFaq(id);
  if (!before) return NextResponse.json({ message: "FAQ를 찾을 수 없습니다." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });

  const input: FaqInput = {
    category: asString(body.category) || "기타",
    question: asString(body.question),
    answer: asString(body.answer),
    isPublished: asBool(body.isPublished),
    displayOrder: Number(body.displayOrder) || 0,
  };

  const result = updateFaq(id, input);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "update",
    targetType: "faq",
    targetId: id,
    targetName: input.question,
    description: "FAQ를 수정했습니다.",
    beforeData: before,
    afterData: input,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:faqs");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminFaq(id);
  if (!before) return NextResponse.json({ message: "FAQ를 찾을 수 없습니다." }, { status: 404 });

  deleteFaq(id);

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "delete",
    targetType: "faq",
    targetId: id,
    targetName: before.question,
    description: "FAQ를 삭제했습니다.",
    beforeData: before,
  });

  return NextResponse.json({ ok: true });
}
