import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { answerInquiry, getAdminInquiry } from "@/lib/admin-extra";
import { logAdminAction } from "@/lib/activity-log";
import { notifyInquiryAnswered } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { answer?: unknown } | null;
  const answer = body && typeof body.answer === "string" ? body.answer : "";

  const result = answerInquiry(id, answer, admin.email);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  const inquiry = getAdminInquiry(id);

  // 관리자 활동 로그 기록
  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: "answer",
    targetType: "inquiry",
    targetId: id,
    targetName: inquiry?.title ?? null,
    description: `문의에 답변했습니다.`,
  });

  // 문의자에게 답변 등록 안내 메일 (실패해도 답변 처리에는 영향 없음)
  if (inquiry?.userEmail) {
    await notifyInquiryAnswered({
      userEmail: inquiry.userEmail,
      userName: inquiry.userName,
      inquiryTitle: inquiry.title,
      answer: answer.trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
