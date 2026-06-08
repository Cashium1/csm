import { randomUUID } from "node:crypto";
import { getCourse } from "@/lib/data";
import { getDatabase } from "@/lib/db";
import { hasCourseAccess } from "@/lib/purchases";

export type OrderStatus = "pending" | "paid" | "failed" | "canceled";

export type Order = {
  id: string;
  userId: string;
  courseSlug: string;
  orderName: string;
  amount: number;
  status: OrderStatus;
  paymentKey: string | null;
  method: string | null;
  receiptUrl: string | null;
  approvedAt: string | null;
  failReason: string | null;
  createdAt: string;
};

type OrderRow = {
  id: string;
  user_id: string;
  course_slug: string;
  order_name: string;
  amount: number;
  status: OrderStatus;
  payment_key: string | null;
  method: string | null;
  receipt_url: string | null;
  approved_at: string | null;
  fail_reason: string | null;
  created_at: string;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    courseSlug: row.course_slug,
    orderName: row.order_name,
    amount: row.amount,
    status: row.status,
    paymentKey: row.payment_key,
    method: row.method,
    receiptUrl: row.receipt_url,
    approvedAt: row.approved_at,
    failReason: row.fail_reason,
    createdAt: row.created_at,
  };
}

// 결제 전 주문을 생성합니다. 결제 금액은 이 시점에 서버가 확정해 저장합니다.
export function createOrder(userId: string, courseSlug: string) {
  const course = getCourse(courseSlug);

  if (!course) {
    return { ok: false as const, message: "강의를 찾을 수 없습니다." };
  }

  if (course.priceNumber <= 0) {
    return { ok: false as const, message: "무료 강의는 결제가 필요하지 않습니다." };
  }

  if (hasCourseAccess(userId, courseSlug)) {
    return { ok: false as const, message: "이미 보유 중인 강의입니다." };
  }

  // 관리자가 비공개 또는 판매중지로 설정한 강의는 결제할 수 없습니다.
  const flags = getDatabase()
    .prepare(`SELECT is_published, is_on_sale FROM courses WHERE slug = ?`)
    .get(courseSlug) as { is_published: number; is_on_sale: number } | undefined;
  if (flags && (flags.is_published !== 1 || flags.is_on_sale !== 1)) {
    return { ok: false as const, message: "현재 판매가 중지된 강의입니다." };
  }

  const now = new Date().toISOString();
  const id = `order_${randomUUID()}`;

  getDatabase()
    .prepare(`
      INSERT INTO orders (
        id, user_id, course_slug, order_name, amount, original_amount, discount_amount,
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)
    `)
    .run(id, userId, courseSlug, course.title, course.priceNumber, course.priceNumber, now, now);

  return {
    ok: true as const,
    order: { id, amount: course.priceNumber, orderName: course.title, courseSlug },
  };
}

// 쿠폰 적용 정보를 주문에 저장합니다. (사용량 차감은 결제 성공 시점에 별도로 처리)
export function applyCouponToOrder(
  orderId: string,
  input: { couponId: string; couponCode: string; discountAmount: number; finalAmount: number },
) {
  getDatabase()
    .prepare(`
      UPDATE orders
      SET amount = ?,
          discount_amount = ?,
          coupon_id = ?,
          coupon_code = ?,
          updated_at = ?
      WHERE id = ?
    `)
    .run(
      input.finalAmount,
      input.discountAmount,
      input.couponId,
      input.couponCode,
      new Date().toISOString(),
      orderId,
    );
}

// 결제에 적용된 쿠폰 정보를 조회합니다. (결제 성공 후 사용량 기록용)
export function getOrderCoupon(
  orderId: string,
): { couponId: string; couponCode: string; discountAmount: number } | null {
  const row = getDatabase()
    .prepare(`SELECT coupon_id, coupon_code, discount_amount FROM orders WHERE id = ?`)
    .get(orderId) as
    | { coupon_id: string | null; coupon_code: string | null; discount_amount: number | null }
    | undefined;
  if (!row || !row.coupon_id) return null;
  return {
    couponId: row.coupon_id,
    couponCode: row.coupon_code ?? "",
    discountAmount: row.discount_amount ?? 0,
  };
}

export function getOrderById(orderId: string): Order | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`)
    .get(orderId) as OrderRow | undefined;

  return row ? rowToOrder(row) : null;
}

// 결제 승인 성공 시 주문 상태를 '결제 완료'로 갱신합니다.
// 'pending' 상태일 때만 전이하며, 실제로 전이됐는지(true) 여부를 반환합니다.
// 새로고침/동시 요청 등으로 이미 paid가 된 경우 false를 반환해 후속 처리(쿠폰 차감 등)의 중복을 막습니다.
export function markOrderPaid(
  orderId: string,
  payment: { paymentKey: string; method: string; receiptUrl: string; approvedAt: string },
): boolean {
  const result = getDatabase()
    .prepare(`
      UPDATE orders
      SET status = 'paid',
          payment_key = ?,
          method = ?,
          receipt_url = ?,
          approved_at = ?,
          fail_reason = NULL,
          updated_at = ?
      WHERE id = ? AND status = 'pending'
    `)
    .run(
      payment.paymentKey,
      payment.method,
      payment.receiptUrl,
      payment.approvedAt,
      new Date().toISOString(),
      orderId,
    );

  return result.changes > 0;
}

// 사용자가 본인 주문에 대해 환불을 요청합니다.
// 'paid' 상태일 때만 'refund_requested'로 전이하며, 관리자 환불 대기열/대시보드에 노출됩니다.
export type RefundRequestResult =
  | { ok: true; order: { id: string; orderName: string; courseSlug: string; amount: number } }
  | { ok: false; message: string };

export function requestRefundByUser(
  userId: string,
  orderId: string,
  reason: string,
): RefundRequestResult {
  const order = getOrderById(orderId);

  if (!order || order.userId !== userId) {
    return { ok: false, message: "환불할 주문을 찾을 수 없습니다." };
  }
  if (order.status !== "paid") {
    return { ok: false, message: "환불을 요청할 수 없는 주문 상태입니다." };
  }

  const trimmedReason = reason.trim().slice(0, 500);
  const now = new Date().toISOString();

  // 동시 요청 방지를 위해 status='paid' 조건으로 원자적 전이합니다.
  const result = getDatabase()
    .prepare(`
      UPDATE orders
      SET status = 'refund_requested',
          refund_status = 'requested',
          refund_reason = ?,
          refund_amount = amount,
          refund_requested_at = ?,
          updated_at = ?
      WHERE id = ? AND status = 'paid'
    `)
    .run(trimmedReason || null, now, now, orderId);

  if (result.changes === 0) {
    return { ok: false, message: "이미 환불이 진행 중이거나 환불할 수 없는 주문입니다." };
  }

  return {
    ok: true,
    order: {
      id: order.id,
      orderName: order.orderName,
      courseSlug: order.courseSlug,
      amount: order.amount,
    },
  };
}

// 결제 실패 시 주문 상태를 '실패'로 갱신합니다. (이미 결제 완료된 주문은 건드리지 않음)
export function markOrderFailed(orderId: string, reason: string) {
  getDatabase()
    .prepare(`
      UPDATE orders
      SET status = 'failed', fail_reason = ?, updated_at = ?
      WHERE id = ? AND status != 'paid'
    `)
    .run(reason, new Date().toISOString(), orderId);
}
