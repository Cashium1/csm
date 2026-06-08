import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createInquiry } from "@/lib/admin-extra";
import { notifyNewInquiry } from "@/lib/notifications";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 문의 본문 최대 길이 (과도한 페이로드/스팸 차단)
const MAX_TITLE = 200;
const MAX_CONTENT = 5000;

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

export async function POST(request: NextRequest) {
  // 익명 스팸 방지: 같은 IP에서 10분간 5건까지만 문의 등록 허용.
  const limited = rateLimit(`contact:${getClientIp(request)}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { message: `문의 요청이 너무 많습니다. ${limited.retryAfterSeconds}초 후 다시 시도해 주세요.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  if (asString(body.title).length > MAX_TITLE || asString(body.content).length > MAX_CONTENT) {
    return NextResponse.json(
      { message: `제목은 ${MAX_TITLE}자, 내용은 ${MAX_CONTENT}자 이내로 입력해 주세요.` },
      { status: 400 },
    );
  }

  const user = getCurrentUserFromRequest(request);
  const userName = asString(body.name) || user?.name || "";
  const userEmail = asString(body.email) || user?.email || "";

  const result = createInquiry({
    userId: user?.id ?? null,
    userName,
    userEmail,
    title: asString(body.title),
    content: asString(body.content),
    type: asString(body.type) || "general",
    relatedCourseTitle:
      typeof body.relatedCourseTitle === "string" && body.relatedCourseTitle.trim()
        ? body.relatedCourseTitle.trim()
        : null,
    relatedOrderId:
      typeof body.relatedOrderId === "string" && body.relatedOrderId.trim()
        ? body.relatedOrderId.trim()
        : null,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  // 관리자에게 새 문의 접수 알림 (실패해도 문의 등록에는 영향 없음)
  await notifyNewInquiry({ userName, inquiryTitle: asString(body.title) });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
