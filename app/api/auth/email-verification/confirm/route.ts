import { NextRequest, NextResponse } from "next/server";
import { confirmVerificationCode } from "@/lib/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 사용자가 입력한 이메일 인증코드를 검증합니다.
export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code : "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: "올바른 이메일을 입력해 주세요." }, { status: 400 });
  }

  const result = confirmVerificationCode(email, code);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ message: "이메일 인증이 완료되었습니다." }, { status: 200 });
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { email?: unknown; code?: unknown };
  } catch {
    return {};
  }
}
