import { NextRequest, NextResponse } from "next/server";
import { isEmailTaken } from "@/lib/auth";
import { isEmailDeliveryConfigured } from "@/lib/email";
import { issueVerificationCode, sendVerificationCodeEmail } from "@/lib/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 회원가입용 이메일 인증코드를 발급해 메일로 발송합니다.
export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!emailPattern.test(email)) {
    return NextResponse.json({ message: "올바른 이메일을 입력해 주세요." }, { status: 400 });
  }

  if (isEmailTaken(email)) {
    return NextResponse.json({ message: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const issued = issueVerificationCode(email);

  if (!issued.ok) {
    return NextResponse.json(
      { message: issued.message, retryAfterSeconds: issued.retryAfterSeconds },
      { status: 429 },
    );
  }

  const delivery = await sendVerificationCodeEmail(email, issued.code);

  if (!delivery.ok) {
    console.error("[email-verification] 발송 실패:", delivery.error);
    return NextResponse.json(
      { message: "인증코드 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }

  // 메일 발송 수단이 없는 개발 환경에서는 테스트 편의를 위해 코드를 응답에 포함합니다.
  const includeDevCode = !isEmailDeliveryConfigured() && process.env.NODE_ENV !== "production";

  return NextResponse.json(
    {
      message: delivery.delivered
        ? "인증코드를 이메일로 보냈습니다. 메일함을 확인해 주세요."
        : "개발 모드: 인증코드가 서버 콘솔에 출력되었습니다.",
      devCode: includeDevCode ? issued.code : undefined,
    },
    { status: 200 },
  );
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { email?: unknown };
  } catch {
    return {};
  }
}
