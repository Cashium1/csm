import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { getAdminReview, setReviewStatus } from "@/lib/admin-extra";
import { logAdminAction } from "@/lib/activity-log";

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

  const review = getAdminReview(id);
  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: body.status === "hidden" ? "unpublish" : "publish",
    targetType: "review",
    targetId: id,
    targetName: review ? `${review.courseTitle} 리뷰` : null,
    description: body.status === "hidden" ? "리뷰를 숨김 처리했습니다." : "리뷰를 노출 처리했습니다.",
  });

  return NextResponse.json({ ok: true });
}
