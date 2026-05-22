import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteUser,
  getCurrentUserFromRequest,
  updateUser,
  verifyUserPassword,
} from "@/lib/auth";
import { clearVerifications, isEmailVerified } from "@/lib/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 회원 정보 수정 (이름 / 이메일 / 비밀번호)
export async function PATCH(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: unknown; email?: unknown; password?: unknown; currentPassword?: unknown }
    | null;

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  // 본인 확인: 현재 비밀번호를 검증합니다. (게이트가 우회되지 않도록 서버에서도 확인)
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";

  if (!verifyUserPassword(user.id, currentPassword)) {
    return NextResponse.json(
      {
        message: "본인 확인에 실패했습니다. 비밀번호를 다시 확인해 주세요.",
        errors: { currentPassword: "비밀번호가 올바르지 않습니다." },
      },
      { status: 403 },
    );
  }

  // 이메일을 변경하는 경우, 변경할 이메일의 인증이 완료되어야 합니다.
  const nextEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const isEmailChanged = nextEmail.length > 0 && nextEmail !== user.email.toLowerCase();

  if (isEmailChanged && !isEmailVerified(nextEmail)) {
    return NextResponse.json(
      {
        message: "변경할 이메일의 인증을 완료해 주세요.",
        errors: { email: "이메일 인증이 필요합니다." },
      },
      { status: 400 },
    );
  }

  const result = updateUser(user.id, {
    name: body.name,
    email: body.email,
    password: body.password,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: "입력값을 확인해 주세요.", errors: result.errors },
      { status: 400 },
    );
  }

  // 이메일 변경이 반영됐으면 사용한 인증 기록을 정리합니다.
  if (isEmailChanged) {
    clearVerifications(nextEmail);
  }

  return NextResponse.json({ ok: true, user: result.user });
}

// 회원 탈퇴
export async function DELETE(request: NextRequest) {
  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  deleteUser(user.id);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
