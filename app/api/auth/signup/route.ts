import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, createSession, createUser, validateSignupFields } from "@/lib/auth";
import { clearVerifications, isEmailVerified } from "@/lib/email-verification";
import { notifySignup } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const { email, password, name, errors, isValid } = validateSignupFields(
    body.email,
    body.password,
    body.name,
    body.passwordConfirm,
  );

  if (!isValid) {
    return NextResponse.json({ message: "입력값을 확인해 주세요.", errors }, { status: 400 });
  }

  if (!isEmailVerified(email)) {
    return NextResponse.json(
      { message: "이메일 인증을 완료해 주세요.", errors: { email: "이메일 인증이 필요합니다." } },
      { status: 400 },
    );
  }

  const result = createUser(email, password, name);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 409 });
  }

  // 가입 완료 후 사용한 인증 기록을 정리합니다.
  clearVerifications(email);

  // 가입 환영 + 관리자 신규가입 알림 (실패해도 가입은 정상 처리)
  await notifySignup({ name: result.user.name, email: result.user.email });

  const token = createSession(result.user.id);
  const response = NextResponse.json({ user: result.user }, { status: 201 });
  attachSessionCookie(response, token);

  return response;
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
      passwordConfirm?: unknown;
    };
  } catch {
    return {};
  }
}
