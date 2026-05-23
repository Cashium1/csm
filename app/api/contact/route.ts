import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createInquiry } from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
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
  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
