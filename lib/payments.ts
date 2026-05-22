import { getCourse } from "@/lib/data";
import { getDatabase } from "@/lib/db";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

/** 결제 내역 목록에 필요한 요약 정보 */
export type PaymentSummary = {
  id: string;
  orderNumber: string;
  paidAt: string;
  productName: string;
  courseSlug: string;
  finalPrice: number;
  paymentMethod: string;
  status: PaymentStatus;
};

/** 결제 상세 페이지에 필요한 전체 정보 */
export type PaymentDetail = PaymentSummary & {
  paymentNumber: string;
  buyerName: string;
  buyerEmail: string;
  category: string;
  productType: string;
  courseStatus: string;
  accessPeriod: string;
  originalPrice: number;
  discountAmount: number;
  couponName: string | null;
  cardCompany: string | null;
  approvalNumber: string;
  refundable: boolean;
  refundStatus: string | null;
  refundCompletedAt: string | null;
  refundReason: string | null;
  receiptUrl: string;
};

type PurchaseRow = {
  id: string;
  course_slug: string;
  purchased_at: string;
  completed: number;
};

const PURCHASE_SELECT = `
  SELECT
    cp.id,
    cp.course_slug,
    cp.purchased_at,
    CASE WHEN cc.id IS NOT NULL THEN 1 ELSE 0 END AS completed
  FROM course_purchases cp
  LEFT JOIN course_completions cc
    ON cc.user_id = cp.user_id AND cc.course_slug = cp.course_slug
`;

/** 본인 계정의 모든 결제 내역을 최신순으로 조회합니다. */
export function getPaymentsForUser(userId: string): PaymentSummary[] {
  const rows = getDatabase()
    .prepare(`${PURCHASE_SELECT} WHERE cp.user_id = ? ORDER BY cp.purchased_at DESC`)
    .all(userId) as PurchaseRow[];

  return rows
    .map((row) => buildSummary(row))
    .filter((summary): summary is PaymentSummary => summary !== null);
}

/**
 * paymentId에 해당하는 결제 상세 정보를 조회합니다.
 * 반드시 본인(user.id) 계정의 결제 건만 반환하며, 없으면 null을 반환합니다.
 */
export function getPaymentDetail(
  user: { id: string; name: string; email: string },
  paymentId: string,
): PaymentDetail | null {
  const row = getDatabase()
    .prepare(`${PURCHASE_SELECT} WHERE cp.id = ? AND cp.user_id = ? LIMIT 1`)
    .get(paymentId, user.id) as PurchaseRow | undefined;

  if (!row) {
    return null;
  }

  return buildDetail(row, user);
}

// --- 결제 데이터 구성 ----------------------------------------------------------

const PAYMENT_METHODS = ["신용카드", "카카오페이", "네이버페이", "토스페이", "계좌이체"] as const;
const CARD_COMPANIES = ["신한카드", "삼성카드", "현대카드", "KB국민카드", "우리카드", "롯데카드"] as const;
const COUPONS = ["첫 구매 할인 쿠폰", "캐쉬움 웰컴 쿠폰", "수강생 추천 할인"] as const;
const EASY_PAY = new Set<string>(["카카오페이", "네이버페이", "토스페이"]);

function buildSummary(row: PurchaseRow): PaymentSummary | null {
  const course = getCourse(row.course_slug);
  if (!course) {
    return null;
  }

  return {
    id: row.id,
    orderNumber: buildOrderNumber(row.id, row.purchased_at),
    paidAt: row.purchased_at,
    productName: course.title,
    courseSlug: course.slug,
    finalPrice: course.priceNumber,
    paymentMethod: pick(PAYMENT_METHODS, seed(row.id, "method")),
    status: "paid",
  };
}

function buildDetail(
  row: PurchaseRow,
  user: { name: string; email: string },
): PaymentDetail | null {
  const summary = buildSummary(row);
  const course = getCourse(row.course_slug);
  if (!summary || !course) {
    return null;
  }

  const originalPrice = parseWon(course.originalPrice, course.priceNumber);
  const discountAmount = Math.max(0, originalPrice - summary.finalPrice);

  return {
    ...summary,
    paymentNumber: `PG-${digits(seed(row.id, "pg"), 9)}`,
    buyerName: user.name,
    buyerEmail: user.email,
    category: course.category,
    productType: "PDF 강의",
    courseStatus: row.completed ? "수강 완료" : "수강 가능",
    accessPeriod: "무제한",
    originalPrice,
    discountAmount,
    couponName: discountAmount > 0 ? pick(COUPONS, seed(row.id, "coupon")) : null,
    cardCompany: resolveProvider(summary.paymentMethod, row.id),
    approvalNumber: digits(seed(row.id, "approval"), 8),
    refundable: true,
    refundStatus: null,
    refundCompletedAt: null,
    refundReason: null,
    receiptUrl: "#",
  };
}

function resolveProvider(paymentMethod: string, id: string): string | null {
  if (paymentMethod === "신용카드") {
    return pick(CARD_COMPANIES, seed(id, "card"));
  }
  if (EASY_PAY.has(paymentMethod)) {
    return paymentMethod;
  }
  return null;
}

function buildOrderNumber(id: string, purchasedAt: string): string {
  return `CSM-${compactDate(purchasedAt)}-${digits(seed(id, "order"), 4)}`;
}

// --- 결정적(deterministic) 파생값 헬퍼 -----------------------------------------
// 결제 행의 고유 id로부터 주문번호·승인번호 등을 항상 동일하게 생성합니다.

function seed(id: string, salt: string): number {
  return fnv1a(`${id}:${salt}`);
}

function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick<T>(items: readonly T[], value: number): T {
  return items[value % items.length];
}

function digits(value: number, length: number): string {
  return String(value % 10 ** length).padStart(length, "0");
}

function compactDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "00000000";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function parseWon(text: string, fallback: number): number {
  const numeric = Number(text.replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}
