import type { NextConfig } from "next";

// 모든 응답에 적용할 기본 보안 헤더입니다.
const securityHeaders = [
  // 콘텐츠 타입 스니핑 방지
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 클릭재킹 방지 (iframe 삽입 차단)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Referer 정보 최소 노출
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 불필요한 브라우저 기능 권한 차단
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS 강제 (HTTP 접근을 HTTPS로 승격). HTTPS 운영 환경에서만 의미가 있습니다.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // 응답에서 X-Powered-By: Next.js 헤더를 제거해 스택 정보 노출을 줄입니다.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
