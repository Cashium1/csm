import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest, verifyUserPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 회원정보 수정 페이지 진입 전, 현재 비밀번호로 본인 확인을 합니다.
export async function POST(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = body && typeof body.password === "string" ? body.password : "";

  if (!password) {
    return NextResponse.json({ message: "비밀번호를 입력해 주세요." }, { status: 400 });
  }

  if (!verifyUserPassword(user.id, password)) {
    return NextResponse.json({ message: "비밀번호가 올바르지 않습니다." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
