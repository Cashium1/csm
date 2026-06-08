// 운영에 필요한 환경변수를 한곳에서 정의·검증합니다.
// 실제 값은 코드가 아니라 배포 플랫폼의 환경변수(또는 로컬 .env.local)에 넣습니다.
// 슬롯(어떤 변수를 넣어야 하는지)은 .env.example 파일에 정리돼 있습니다.

type EnvSpec = {
  key: string;
  // required: 없으면 핵심 기능(결제 등)이 동작하지 않는 필수 값
  required: boolean;
  description: string;
};

// NEXT_PUBLIC_* 은 클라이언트(브라우저)에 노출됩니다. 시크릿은 절대 NEXT_PUBLIC_ 접두어를 쓰지 마세요.
export const ENV_SPEC: EnvSpec[] = [
  {
    key: "NEXT_PUBLIC_TOSS_CLIENT_KEY",
    required: true,
    description: "토스페이먼츠 클라이언트 키(결제창 호출용, 공개 키)",
  },
  {
    key: "TOSS_SECRET_KEY",
    required: true,
    description: "토스페이먼츠 시크릿 키(결제 승인/환불, 비밀 — 절대 노출 금지)",
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    description: "Resend 이메일 발송 키(없으면 메일이 서버 콘솔 출력으로 대체됨)",
  },
  {
    key: "EMAIL_FROM",
    required: false,
    description: "이메일 발신 주소(Resend에서 인증된 도메인 주소여야 실제 발송됨)",
  },
  {
    key: "ADMIN_EMAILS",
    required: false,
    description: "관리자로 자동 승격할 이메일(쉼표로 여러 개). 이 이메일로 가입하면 관리자가 됩니다.",
  },
  {
    key: "DATA_DIR",
    required: false,
    description: "SQLite 데이터 디렉터리 경로(미설정 시 프로젝트의 ./data). 영속 볼륨 배포 시 마운트 경로 지정.",
  },
];

export type EnvReport = {
  ok: boolean;
  missingRequired: string[];
  missingRecommended: string[];
};

// 환경변수 상태를 점검해 리포트를 반환합니다. (값 자체는 로그에 남기지 않습니다)
export function checkEnv(): EnvReport {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  for (const spec of ENV_SPEC) {
    const value = process.env[spec.key];
    if (!value || value.trim() === "") {
      if (spec.required) missingRequired.push(spec.key);
      else missingRecommended.push(spec.key);
    }
  }

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    missingRecommended,
  };
}

// 서버 시작 시 1회 호출합니다. (instrumentation.ts)
// 사이트 전체를 죽이지 않기 위해 예외를 던지지 않고, 누락 항목을 명확히 로그로 경고합니다.
export function logEnvStatus(): void {
  const report = checkEnv();
  const isProd = process.env.NODE_ENV === "production";

  if (report.missingRequired.length > 0) {
    const level = isProd ? "error" : "warn";
    console[level](
      `[env] 필수 환경변수 누락: ${report.missingRequired.join(", ")}\n` +
        `       → 결제 등 핵심 기능이 동작하지 않습니다. 배포 플랫폼의 환경변수에 값을 설정하세요. (.env.example 참고)`,
    );
  }

  if (report.missingRecommended.length > 0) {
    console.warn(
      `[env] 권장 환경변수 미설정: ${report.missingRecommended.join(", ")}\n` +
        `       → 해당 기능은 대체 동작(예: 메일은 콘솔 출력)으로 실행됩니다.`,
    );
  }

  if (report.ok && report.missingRecommended.length === 0) {
    console.info("[env] 모든 환경변수가 설정되었습니다.");
  }
}
