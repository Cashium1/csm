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

// 실제 orders 테이블의 결제 행. 결제 내역은 전부 이 데이터에서 파생합니다.
type OrderRow = {
  id: string;
  course_slug: string;
  order_name: string;
  amount: number;
  original_amount: number | null;
  discount_amount: number | null;
  coupon_code: string | null;
  status: string;
  method: string | null;
  payment_key: string | null;
  receipt_url: string | null;
  approved_at: string | null;
  created_at: string;
  refund_status: string | null;
  refund_reason: string | null;
  refunded_at: string | null;
  completed: number;
};

// 결제 내역으로 노출할 주문 상태. (미결제 pending / 실패 failed 주문은 제외)
const VISIBLE_STATUSES = ["paid", "refund_requested", "refunded"] as const;

const ORDER_SELECT = `
  SELECT
    o.id,
    o.course_slug,
    o.order_name,
    o.amount,
    o.original_amount,
    o.discount_amount,
    o.coupon_code,
    o.status,
    o.method,
    o.payment_key,
    o.receipt_url,
    o.approved_at,
    o.created_at,
    o.refund_status,
    o.refund_reason,
    o.refunded_at,
    CASE WHEN cc.id IS NOT NULL THEN 1 ELSE 0 END AS completed
  FROM orders o
  LEFT JOIN course_completions cc
    ON cc.user_id = o.user_id AND cc.course_slug = o.course_slug
`;

/** 본인 계정의 모든 결제 내역(결제 완료/환불)을 최신순으로 조회합니다. */
export function getPaymentsForUser(userId: string): PaymentSummary[] {
  const placeholders = VISIBLE_STATUSES.map(() => "?").join(", ");
  const rows = getDatabase()
    .prepare(
      `${ORDER_SELECT}
       WHERE o.user_id = ? AND o.status IN (${placeholders})
       ORDER BY COALESCE(o.approved_at, o.created_at) DESC`,
    )
    .all(userId, ...VISIBLE_STATUSES) as OrderRow[];

  return rows
    .map((row) => buildSummary(row))
    .filter((summary): summary is PaymentSummary => summary !== null);
}

/**
 * paymentId(주문 id)에 해당하는 결제 상세 정보를 조회합니다.
 * 반드시 본인(user.id) 계정의 결제 건만 반환하며, 없으면 null을 반환합니다.
 */
export function getPaymentDetail(
  user: { id: string; name: string; email: string },
  paymentId: string,
): PaymentDetail | null {
  const row = getDatabase()
    .prepare(`${ORDER_SELECT} WHERE o.id = ? AND o.user_id = ? LIMIT 1`)
    .get(paymentId, user.id) as OrderRow | undefined;

  if (!row) {
    return null;
  }

  return buildDetail(row, user);
}

// --- 결제 데이터 구성 ----------------------------------------------------------

function mapStatus(orderStatus: string): PaymentStatus {
  switch (orderStatus) {
    case "refunded":
      return "refunded";
    case "failed":
    case "canceled":
      return "failed";
    case "pending":
      return "pending";
    // paid, refund_requested 모두 결제 자체는 완료된 상태로 표시합니다.
    default:
      return "paid";
  }
}

function buildSummary(row: OrderRow): PaymentSummary | null {
  const course = getCourse(row.course_slug);

  return {
    id: row.id,
    orderNumber: buildOrderNumber(row),
    paidAt: row.approved_at ?? row.created_at,
    productName: course?.title ?? row.order_name,
    courseSlug: row.course_slug,
    finalPrice: row.amount,
    paymentMethod: row.method?.trim() || "—",
    status: mapStatus(row.status),
  };
}

function buildDetail(
  row: OrderRow,
  user: { name: string; email: string },
): PaymentDetail | null {
  const summary = buildSummary(row);
  if (!summary) {
    return null;
  }
  const course = getCourse(row.course_slug);

  const discountAmount = Math.max(0, row.discount_amount ?? 0);
  const originalPrice = row.original_amount ?? row.amount + discountAmount;

  // 쿠폰 코드가 있으면 쿠폰명을 조회해 함께 표시합니다.
  const couponName = row.coupon_code ? resolveCouponName(row.coupon_code) : null;

  const refundStatusLabel = mapRefundStatus(row.refund_status);

  return {
    ...summary,
    paymentNumber: row.payment_key ?? "—",
    buyerName: user.name,
    buyerEmail: user.email,
    category: course?.category ?? "—",
    productType: "PDF 강의",
    courseStatus: row.completed ? "수강 완료" : "수강 가능",
    accessPeriod: "무제한",
    originalPrice,
    discountAmount,
    couponName,
    cardCompany: null,
    approvalNumber: row.payment_key ?? "—",
    // 결제 완료 상태이고 아직 환불 이력이 없을 때만 환불 요청이 가능합니다.
    refundable: row.status === "paid",
    refundStatus: refundStatusLabel,
    refundCompletedAt: row.refunded_at,
    refundReason: row.refund_reason,
    receiptUrl: row.receipt_url ?? "",
  };
}

function mapRefundStatus(status: string | null): string | null {
  switch (status) {
    case "requested":
      return "환불 요청 접수";
    case "completed":
      return "환불 완료";
    default:
      return null;
  }
}

function resolveCouponName(code: string): string {
  const row = getDatabase()
    .prepare(`SELECT name FROM coupons WHERE LOWER(code) = LOWER(?) LIMIT 1`)
    .get(code) as { name: string } | undefined;
  return row?.name ?? code;
}

// 주문 id(order_<uuid>)로부터 사람이 읽기 쉬운 주문번호를 만듭니다.
function buildOrderNumber(row: OrderRow): string {
  const date = compactDate(row.approved_at ?? row.created_at);
  const suffix = digits(fnv1a(row.id), 4);
  return `CSM-${date}-${suffix}`;
}

function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
