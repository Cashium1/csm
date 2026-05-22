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

  const now = new Date().toISOString();
  const id = `order_${randomUUID()}`;

  getDatabase()
    .prepare(`
      INSERT INTO orders (
        id, user_id, course_slug, order_name, amount, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
    .run(id, userId, courseSlug, course.title, course.priceNumber, now, now);

  return {
    ok: true as const,
    order: { id, amount: course.priceNumber, orderName: course.title, courseSlug },
  };
}

export function getOrderById(orderId: string): Order | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`)
    .get(orderId) as OrderRow | undefined;

  return row ? rowToOrder(row) : null;
}

// 결제 승인 성공 시 주문 상태를 '결제 완료'로 갱신합니다.
export function markOrderPaid(
  orderId: string,
  payment: { paymentKey: string; method: string; receiptUrl: string; approvedAt: string },
) {
  getDatabase()
    .prepare(`
      UPDATE orders
      SET status = 'paid',
          payment_key = ?,
          method = ?,
          receipt_url = ?,
          approved_at = ?,
          fail_reason = NULL,
          updated_at = ?
      WHERE id = ?
    `)
    .run(
      payment.paymentKey,
      payment.method,
      payment.receiptUrl,
      payment.approvedAt,
      new Date().toISOString(),
      orderId,
    );
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
