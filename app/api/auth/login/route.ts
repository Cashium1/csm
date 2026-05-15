import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, authenticateUser, createSession, validateAuthFields } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const { email, password, errors, isValid } = validateAuthFields(body.email, body.password);

  if (!isValid) {
    return NextResponse.json({ message: "입력값을 확인해 주세요.", errors }, { status: 400 });
  }

  const user = authenticateUser(email, password);

  if (!user) {
    return NextResponse.json({ message: "이메일 또는 비밀번호를 확인해 주세요." }, { status: 401 });
  }

  const token = createSession(user.id);
  const response = NextResponse.json({ user });
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
