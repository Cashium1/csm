import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { answerInquiry } from "@/lib/admin-extra";

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
  return NextResponse.json({ ok: true });
}
