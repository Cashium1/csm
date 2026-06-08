import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, authenticateUser, createSession, validateAuthFields } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const { email, password, errors, isValid } = validateAuthFields(body.email, body.password);

  if (!isValid) {
    return NextResponse.json({ message: "입력값을 확인해 주세요.", errors }, { status: 400 });
  }

  // 무차별 대입(brute-force) 방지: IP+이메일 조합으로 5분간 10회까지만 시도 허용.
  const limited = rateLimit(`login:${getClientIp(request)}:${email}`, {
    limit: 10,
    windowMs: 5 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { message: `로그인 시도가 너무 많습니다. ${limited.retryAfterSeconds}초 후 다시 시도해 주세요.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const auth = authenticateUser(email, password);

  if (!auth.ok) {
    const status = auth.reason === "invalid" ? 401 : 403;
    return NextResponse.json({ message: auth.message }, { status });
  }

  const token = createSession(auth.user.id);
  const response = NextResponse.json({ user: auth.user });
  attachSessionCookie(response, token);

  return response;
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return {};
  }
}
