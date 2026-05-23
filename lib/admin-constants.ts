// 클라이언트 컴포넌트가 가져갈 수 있도록 DB 의존성이 없는 순수 상수만 모아둡니다.
// 서버 전용 lib(admin.ts, admin-extra2.ts)가 이 파일에서 re-export 합니다.

export const COURSE_GROUPS: Array<{ key: string; label: string }> = [
  { key: "ai-service", label: "AI 활용 기반 서비스 제작" },
  { key: "affiliate", label: "제휴 마케팅" },
  { key: "seo-blog", label: "블로그 수익화" },
  { key: "ecommerce", label: "이커머스" },
  { key: "reviewer", label: "리뷰어" },
];

export const FAQ_CATEGORIES = ["강의", "결제", "환불", "계정", "수강", "기타"] as const;

export const POLICY_TYPES = [
  { key: "terms", label: "이용약관" },
  { key: "privacy", label: "개인정보처리방침" },
  { key: "refund", label: "환불정책" },
  { key: "content", label: "콘텐츠 이용 정책" },
  { key: "marketing", label: "마케팅 수신 동의" },
] as const;

export const POLICY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  POLICY_TYPES.map((t) => [t.key, t.label]),
);

export const FILE_TYPES = [
  { key: "pdf", label: "PDF" },
  { key: "thumbnail", label: "썸네일" },
  { key: "detail_image", label: "상세 이미지" },
  { key: "banner_image", label: "배너 이미지" },
  { key: "etc", label: "기타" },
] as const;

export const FILE_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  FILE_TYPES.map((t) => [t.key, t.label]),
);

// 주문 상태 라벨 (admin.ts와 동일 — 클라이언트에서도 필요)
export const ORDER_STATUS_LABELS: Record<string, string> = {
  paid: "결제완료",
  failed: "결제실패",
  refund_requested: "환불요청",
  refunded: "환불완료",
  pending: "결제대기",
  canceled: "주문취소",
};
