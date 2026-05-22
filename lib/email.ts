type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendEmailResult = {
  ok: boolean;
  // 실제 메일이 발송됐는지 여부. false면 개발 모드(콘솔 출력)로 대체된 것입니다.
  delivered: boolean;
  error?: string;
};

// 발신 주소. Resend를 쓸 경우 인증된 도메인 주소로 바꿔야 합니다.
// (resend.dev 주소는 테스트용으로 본인 계정 이메일로만 발송됩니다.)
const fromAddress = process.env.EMAIL_FROM ?? "캐쉬움 <onboarding@resend.dev>";

// 실제 메일 발송 수단이 설정되어 있는지 확인합니다.
export function isEmailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

// 메일을 발송합니다.
// - RESEND_API_KEY가 있으면 Resend HTTP API로 실제 발송합니다.
// - 없으면 개발 모드로 간주해 서버 콘솔에 내용을 출력합니다.
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.info(
      [
        "",
        "[email:dev] 메일 발송 수단이 설정되지 않아 콘솔 출력으로 대체합니다.",
        `  to      : ${input.to}`,
        `  subject : ${input.subject}`,
        `  body    : ${input.text}`,
        "",
      ].join("\n"),
    );
    return { ok: true, delivered: false };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        delivered: false,
        error: `메일 발송 실패 (HTTP ${response.status}) ${detail}`.trim(),
      };
    }

    return { ok: true, delivered: true };
  } catch (error) {
    return {
      ok: false,
      delivered: false,
      error: error instanceof Error ? error.message : "메일 발송 중 오류가 발생했습니다.",
    };
  }
}
