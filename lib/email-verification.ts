import { createHash, randomInt, randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const codeTtlMs = 10 * 60 * 1000; // 인증코드 유효시간: 10분
const resendCooldownMs = 60 * 1000; // 재발송 대기시간: 60초
const verifiedTtlMs = 60 * 60 * 1000; // 인증 완료 상태 유효시간: 60분
const maxAttempts = 5; // 코드 입력 시도 횟수 제한

type VerificationRow = {
  id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  consumed_at: string | null;
  attempts: number;
  created_at: string;
};

type IssueResult =
  | { ok: true; code: string }
  | { ok: false; message: string; retryAfterSeconds?: number };

type ConfirmResult = { ok: true } | { ok: false; message: string };

// 코드는 평문으로 저장하지 않고 (이메일+코드) 해시로 저장합니다.
function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

function getLatestRow(email: string) {
  return getDatabase()
    .prepare(`
      SELECT id, email, code_hash, expires_at, consumed_at, attempts, created_at
      FROM email_verifications
      WHERE email = ?
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(email.toLowerCase()) as VerificationRow | undefined;
}

// 인증코드를 발급해 DB에 저장하고, 발급된 코드를 반환합니다.
export function issueVerificationCode(email: string): IssueResult {
  const normalizedEmail = email.trim().toLowerCase();
  const database = getDatabase();
  const now = Date.now();

  // 하루 이상 지난 오래된 인증 기록은 정리합니다.
  database
    .prepare(`DELETE FROM email_verifications WHERE created_at < ?`)
    .run(new Date(now - 24 * 60 * 60 * 1000).toISOString());

  // 재발송 쿨다운: 직전 발급으로부터 60초가 지나지 않았으면 거부합니다.
  const latest = getLatestRow(normalizedEmail);

  if (latest) {
    const elapsed = now - new Date(latest.created_at).getTime();

    if (elapsed < resendCooldownMs) {
      return {
        ok: false,
        message: "인증코드를 너무 자주 요청했습니다. 잠시 후 다시 시도해 주세요.",
        retryAfterSeconds: Math.ceil((resendCooldownMs - elapsed) / 1000),
      };
    }
  }

  // 새 코드를 발급하기 전 해당 이메일의 기존 코드를 모두 무효화합니다.
  database.prepare(`DELETE FROM email_verifications WHERE email = ?`).run(normalizedEmail);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const nowIso = new Date(now).toISOString();
  const expiresAt = new Date(now + codeTtlMs).toISOString();

  database
    .prepare(`
      INSERT INTO email_verifications (
        id, email, code_hash, expires_at, consumed_at, attempts, created_at
      )
      VALUES (?, ?, ?, ?, NULL, 0, ?)
    `)
    .run(randomUUID(), normalizedEmail, hashCode(normalizedEmail, code), expiresAt, nowIso);

  return { ok: true, code };
}

// 사용자가 입력한 인증코드를 검증합니다. 성공 시 해당 이메일을 인증 완료 처리합니다.
export function confirmVerificationCode(email: string, code: string): ConfirmResult {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim();

  if (!/^\d{6}$/.test(trimmedCode)) {
    return { ok: false, message: "인증코드 6자리를 정확히 입력해 주세요." };
  }

  const database = getDatabase();
  const row = getLatestRow(normalizedEmail);

  if (!row) {
    return { ok: false, message: "먼저 이메일 인증코드를 요청해 주세요." };
  }

  // 이미 인증된 이메일이면 멱등하게 성공 처리합니다.
  if (row.consumed_at) {
    return { ok: true };
  }

  if (Date.now() > new Date(row.expires_at).getTime()) {
    return { ok: false, message: "인증코드가 만료되었습니다. 다시 요청해 주세요." };
  }

  if (row.attempts >= maxAttempts) {
    return { ok: false, message: "인증 시도 횟수를 초과했습니다. 코드를 다시 요청해 주세요." };
  }

  if (row.code_hash !== hashCode(normalizedEmail, trimmedCode)) {
    database
      .prepare(`UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?`)
      .run(row.id);

    const remaining = maxAttempts - (row.attempts + 1);

    return {
      ok: false,
      message:
        remaining > 0
          ? `인증코드가 올바르지 않습니다. (${remaining}회 남음)`
          : "인증 시도 횟수를 초과했습니다. 코드를 다시 요청해 주세요.",
    };
  }

  database
    .prepare(`UPDATE email_verifications SET consumed_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), row.id);

  return { ok: true };
}

// 해당 이메일이 최근에 인증 완료된 상태인지 확인합니다. (회원가입 시 사용)
export function isEmailVerified(email: string) {
  const row = getLatestRow(email.trim().toLowerCase());

  if (!row || !row.consumed_at) {
    return false;
  }

  return Date.now() - new Date(row.consumed_at).getTime() < verifiedTtlMs;
}

// 회원가입 완료 후 해당 이메일의 인증 기록을 정리합니다.
export function clearVerifications(email: string) {
  getDatabase()
    .prepare(`DELETE FROM email_verifications WHERE email = ?`)
    .run(email.trim().toLowerCase());
}

// 인증코드 안내 메일을 발송합니다.
export async function sendVerificationCodeEmail(email: string, code: string) {
  const text = [
    `캐쉬움 회원가입 이메일 인증코드는 ${code} 입니다.`,
    "인증코드는 10분간 유효합니다.",
    "본인이 요청하지 않았다면 이 메일을 무시해 주세요.",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#18181b;">
      <p style="font-size:13px;font-weight:800;color:#b77900;letter-spacing:0.04em;margin:0;">CASHOOM</p>
      <h1 style="font-size:20px;font-weight:900;margin:12px 0 8px;">이메일 인증코드</h1>
      <p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 20px;">
        아래 인증코드를 회원가입 화면에 입력해 주세요.
      </p>
      <div style="background:#fff9dc;border-radius:12px;padding:20px;text-align:center;">
        <span style="font-size:32px;font-weight:900;letter-spacing:0.3em;color:#18181b;">${code}</span>
      </div>
      <p style="font-size:12px;line-height:1.6;color:#a1a1aa;margin:20px 0 0;">
        인증코드는 10분간 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: "[캐쉬움] 이메일 인증코드",
    text,
    html,
  });
}
