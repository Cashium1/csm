// Next.js 서버 인스턴스가 시작될 때 1회 실행됩니다.
// 환경변수 설정 상태를 점검해, 누락된 키를 서버 로그에 명확히 경고합니다.
export async function register() {
  // Node.js 런타임에서만 실행 (Edge 런타임 빌드 시 제외)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvStatus } = await import("@/lib/env");
    logEnvStatus();
  }
}
