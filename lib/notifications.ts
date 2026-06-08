import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/site-settings";

// {{변수}} 형태의 플레이스홀더를 실제 값으로 치환합니다.
function render(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

type TemplateRow = { subject: string; body: string; is_active: number };

/**
 * 이벤트 타입에 해당하는 이메일 템플릿을 렌더링해 발송하고, 그 결과를 email_logs에 기록합니다.
 * - 템플릿이 없거나 비활성(is_active=0)이면 발송하지 않고 조용히 건너뜁니다.
 * - 메일 발송 수단이 없는 개발 환경에서는 sendEmail이 콘솔 출력으로 대체합니다.
 *
 * 알림 실패가 본래 작업(환불 요청 등)을 막지 않도록, 호출 측에서 await 후에도 에러를 무시할 수 있습니다.
 */
export async function dispatchEventEmail(
  eventType: string,
  recipientEmail: string,
  vars: Record<string, string | number>,
): Promise<void> {
  const db = getDatabase();
  const template = db
    .prepare(`SELECT subject, body, is_active FROM email_templates WHERE event_type = ?`)
    .get(eventType) as TemplateRow | undefined;

  if (!template || template.is_active !== 1) {
    return;
  }

  const subject = render(template.subject, vars);
  const text = render(template.body, vars);

  let status = "sent";
  let errorMessage: string | null = null;
  try {
    const result = await sendEmail({ to: recipientEmail, subject, text });
    if (!result.ok) {
      status = "failed";
      errorMessage = result.error ?? "발송 실패";
    } else if (!result.delivered) {
      // 개발 모드(콘솔 출력)로 대체된 경우
      status = "skipped";
    }
  } catch (error) {
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
  }

  const now = new Date().toISOString();
  db
    .prepare(
      `INSERT INTO email_logs (id, event_type, recipient_email, subject, status, error_message, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      eventType,
      recipientEmail,
      subject,
      status,
      errorMessage,
      status === "sent" ? now : null,
      now,
    );
}

// 알림 발송 실패가 본래 작업(가입/결제/문의 등)을 절대 막지 않도록 모든 예외를 삼킵니다.
async function safe(promise: Promise<void>): Promise<void> {
  try {
    await promise;
  } catch {
    // 알림 실패는 무시합니다. (로그는 dispatchEventEmail 내부에서 email_logs에 남깁니다)
  }
}

// 관리자 알림 수신 주소(고객센터 이메일). 비어 있으면 관리자 알림을 보내지 않습니다.
function adminNotifyEmail(): string {
  return getSiteSettings().customerEmail.trim();
}

// ── 이벤트별 알림 래퍼 ────────────────────────────────────────────────
// 각 이벤트 발생 지점에서 호출합니다. 사용자/관리자 대상 메일을 함께 처리합니다.

/** 회원가입 완료: 사용자 환영 + 관리자 신규가입 알림 */
export async function notifySignup(user: { name: string; email: string }): Promise<void> {
  await safe(dispatchEventEmail("signup_completed", user.email, { userName: user.name }));
  const admin = adminNotifyEmail();
  if (admin) {
    await safe(dispatchEventEmail("admin_new_signup", admin, { userName: user.name }));
  }
}

/** 결제 완료: 사용자 결제완료 + 관리자 신규결제 알림 */
export async function notifyPaymentCompleted(
  user: { name: string; email: string },
  order: { id: string; orderName: string; amount: number },
): Promise<void> {
  const vars = {
    userName: user.name,
    courseTitle: order.orderName,
    orderId: order.id,
    amount: order.amount.toLocaleString("ko-KR"),
  };
  await safe(dispatchEventEmail("payment_completed", user.email, vars));
  const admin = adminNotifyEmail();
  if (admin) {
    await safe(dispatchEventEmail("admin_new_payment", admin, vars));
  }
}

/** 새 문의 접수: 관리자 알림 */
export async function notifyNewInquiry(input: {
  userName: string;
  inquiryTitle: string;
}): Promise<void> {
  const admin = adminNotifyEmail();
  if (admin) {
    await safe(
      dispatchEventEmail("admin_new_inquiry", admin, {
        userName: input.userName,
        inquiryTitle: input.inquiryTitle,
      }),
    );
  }
}

/** 문의 답변 완료: 문의자에게 답변 안내 */
export async function notifyInquiryAnswered(input: {
  userEmail: string;
  userName: string;
  inquiryTitle: string;
  answer: string;
}): Promise<void> {
  await safe(
    dispatchEventEmail("inquiry_answered", input.userEmail, {
      userName: input.userName,
      inquiryTitle: input.inquiryTitle,
      answer: input.answer,
    }),
  );
}

/** 새 리뷰 등록: 관리자 알림 */
export async function notifyNewReview(input: {
  userName: string;
  courseTitle: string;
}): Promise<void> {
  const admin = adminNotifyEmail();
  if (admin) {
    await safe(
      dispatchEventEmail("admin_new_review", admin, {
        userName: input.userName,
        courseTitle: input.courseTitle,
      }),
    );
  }
}
