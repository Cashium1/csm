import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { revokeCourseAccessForRefund } from "@/lib/purchases";
import { ORDER_STATUS_LABELS } from "@/lib/admin";

// ============================================================================
// 공통 행 타입
// ============================================================================

type CountRow = { c: number };
type TotalRow = { total: number };

// ============================================================================
// 문의 (Inquiries)
// ============================================================================

export const INQUIRY_TYPES = [
  { key: "course", label: "강의 문의" },
  { key: "payment", label: "결제 문의" },
  { key: "refund", label: "환불 문의" },
  { key: "account", label: "계정 문의" },
  { key: "general", label: "기타 문의" },
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]["key"];

export const INQUIRY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  INQUIRY_TYPES.map((t) => [t.key, t.label]),
);

export const INQUIRY_STATUS_LABEL: Record<string, string> = {
  pending: "답변대기",
  answered: "답변완료",
};

export type AdminInquiry = {
  id: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  type: string;
  relatedCourseId: string | null;
  relatedCourseTitle: string | null;
  relatedOrderId: string | null;
  status: "pending" | "answered";
  answer: string | null;
  answeredAt: string | null;
  answeredBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type InquiryRow = {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  title: string;
  content: string;
  type: string;
  related_course_id: string | null;
  related_course_title: string | null;
  related_order_id: string | null;
  status: string;
  answer: string | null;
  answered_at: string | null;
  answered_by: string | null;
  created_at: string;
  updated_at: string;
};

function rowToInquiry(row: InquiryRow): AdminInquiry {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    title: row.title,
    content: row.content,
    type: row.type,
    relatedCourseId: row.related_course_id,
    relatedCourseTitle: row.related_course_title,
    relatedOrderId: row.related_order_id,
    status: row.status === "answered" ? "answered" : "pending",
    answer: row.answer,
    answeredAt: row.answered_at,
    answeredBy: row.answered_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listAdminInquiries(): AdminInquiry[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM inquiries ORDER BY (status = 'pending') DESC, created_at DESC`,
    )
    .all() as InquiryRow[];
  return rows.map(rowToInquiry);
}

export function getAdminInquiry(id: string): AdminInquiry | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM inquiries WHERE id = ?`)
    .get(id) as InquiryRow | undefined;
  return row ? rowToInquiry(row) : null;
}

export function listInquiriesForUser(userId: string): AdminInquiry[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as InquiryRow[];
  return rows.map(rowToInquiry);
}

export type InquiryCreateInput = {
  userId: string | null;
  userName: string;
  userEmail: string;
  title: string;
  content: string;
  type: string;
  relatedCourseId?: string | null;
  relatedCourseTitle?: string | null;
  relatedOrderId?: string | null;
};

export function createInquiry(input: InquiryCreateInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  const userName = input.userName.trim();
  const userEmail = input.userEmail.trim().toLowerCase();

  if (!title) return { ok: false as const, message: "제목을 입력해 주세요." };
  if (!content) return { ok: false as const, message: "내용을 입력해 주세요." };
  if (!userName) return { ok: false as const, message: "이름을 입력해 주세요." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return { ok: false as const, message: "올바른 이메일을 입력해 주세요." };
  }

  const validTypes = new Set(INQUIRY_TYPES.map((t) => t.key as string));
  const type = validTypes.has(input.type) ? input.type : "general";

  const id = randomUUID();
  const now = new Date().toISOString();

  getDatabase()
    .prepare(
      `INSERT INTO inquiries (
        id, user_id, user_name, user_email, title, content, type,
        related_course_id, related_course_title, related_order_id,
        status, answer, answered_at, answered_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, ?, ?)`,
    )
    .run(
      id,
      input.userId,
      userName,
      userEmail,
      title,
      content,
      type,
      input.relatedCourseId ?? null,
      input.relatedCourseTitle ?? null,
      input.relatedOrderId ?? null,
      now,
      now,
    );

  return { ok: true as const, id };
}

export function answerInquiry(id: string, answer: string, answeredBy: string) {
  const text = answer.trim();
  if (!text) return { ok: false as const, message: "답변 내용을 입력해 주세요." };

  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM inquiries WHERE id = ?`).get(id);
  if (!existing) return { ok: false as const, message: "문의를 찾을 수 없습니다." };

  const now = new Date().toISOString();
  db
    .prepare(
      `UPDATE inquiries SET answer = ?, answered_at = ?, answered_by = ?, status = 'answered', updated_at = ? WHERE id = ?`,
    )
    .run(text, now, answeredBy, now, id);

  return { ok: true as const };
}

// ============================================================================
// 리뷰 관리 (admin은 hidden 포함 전체를 봅니다)
// ============================================================================

export type AdminReview = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseSlug: string;
  courseTitle: string;
  rating: number;
  content: string;
  status: "visible" | "hidden";
  createdAt: string;
  updatedAt: string;
};

type ReviewAdminRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  course_slug: string;
  course_title: string;
  rating: number;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
};

function rowToAdminReview(row: ReviewAdminRow): AdminReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    courseSlug: row.course_slug,
    courseTitle: row.course_title ?? row.course_slug,
    rating: row.rating,
    content: row.content,
    status: row.status === "hidden" ? "hidden" : "visible",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const ADMIN_REVIEW_SELECT = `
  SELECT
    r.id, r.user_id, r.course_slug, r.rating, r.content,
    COALESCE(r.status, 'visible') AS status, r.created_at, r.updated_at,
    u.name AS user_name, u.email AS user_email,
    COALESCE(c.title, r.course_slug) AS course_title
  FROM course_reviews r
  INNER JOIN "USER" u ON u.id = r.user_id
  LEFT JOIN courses c ON c.slug = r.course_slug
`;

export function listAdminReviews(): AdminReview[] {
  const rows = getDatabase()
    .prepare(`${ADMIN_REVIEW_SELECT} ORDER BY r.updated_at DESC`)
    .all() as ReviewAdminRow[];
  return rows.map(rowToAdminReview);
}

export function getAdminReview(id: string): AdminReview | null {
  const row = getDatabase()
    .prepare(`${ADMIN_REVIEW_SELECT} WHERE r.id = ?`)
    .get(id) as ReviewAdminRow | undefined;
  return row ? rowToAdminReview(row) : null;
}

export function listReviewsForUser(userId: string): AdminReview[] {
  const rows = getDatabase()
    .prepare(`${ADMIN_REVIEW_SELECT} WHERE r.user_id = ? ORDER BY r.updated_at DESC`)
    .all(userId) as ReviewAdminRow[];
  return rows.map(rowToAdminReview);
}

export function setReviewStatus(id: string, status: "visible" | "hidden") {
  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM course_reviews WHERE id = ?`).get(id);
  if (!existing) return { ok: false as const, message: "리뷰를 찾을 수 없습니다." };

  db
    .prepare(`UPDATE course_reviews SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, new Date().toISOString(), id);
  return { ok: true as const };
}

// ============================================================================
// 환불 처리
// ============================================================================

export type RefundAction = "request" | "complete" | "memo";

type OrderForRefundRow = {
  id: string;
  user_id: string;
  course_slug: string;
  amount: number;
  status: string;
};

export type RefundUpdate = {
  action: RefundAction;
  refundReason?: string;
  refundAmount?: number;
  adminMemo?: string;
};

export function updateOrderRefund(id: string, update: RefundUpdate) {
  const db = getDatabase();
  const order = db
    .prepare(`SELECT id, user_id, course_slug, amount, status FROM orders WHERE id = ?`)
    .get(id) as OrderForRefundRow | undefined;
  if (!order) return { ok: false as const, message: "주문을 찾을 수 없습니다." };

  const now = new Date().toISOString();

  if (update.action === "memo") {
    db
      .prepare(`UPDATE orders SET admin_memo = ?, updated_at = ? WHERE id = ?`)
      .run(update.adminMemo ?? null, now, id);
    return { ok: true as const };
  }

  if (update.action === "request") {
    db
      .prepare(
        `UPDATE orders
         SET status = 'refund_requested',
             refund_status = 'requested',
             refund_reason = ?,
             refund_amount = ?,
             refund_requested_at = ?,
             admin_memo = COALESCE(?, admin_memo),
             updated_at = ?
         WHERE id = ?`,
      )
      .run(
        update.refundReason ?? null,
        update.refundAmount ?? order.amount,
        now,
        update.adminMemo ?? null,
        now,
        id,
      );
    return { ok: true as const };
  }

  // complete
  db
    .prepare(
      `UPDATE orders
       SET status = 'refunded',
           refund_status = 'completed',
           refund_reason = COALESCE(?, refund_reason),
           refund_amount = COALESCE(?, refund_amount, amount),
           refunded_at = ?,
           admin_memo = COALESCE(?, admin_memo),
           updated_at = ?
       WHERE id = ?`,
    )
    .run(
      update.refundReason ?? null,
      update.refundAmount ?? null,
      now,
      update.adminMemo ?? null,
      now,
      id,
    );

  // 수강 권한 비활성화
  revokeCourseAccessForRefund(order.user_id, order.course_slug);

  return { ok: true as const };
}

export type AdminOrderDetail = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderName: string;
  courseSlug: string;
  amount: number;
  method: string;
  status: string;
  paymentKey: string | null;
  receiptUrl: string | null;
  approvedAt: string | null;
  refundStatus: string;
  refundReason: string | null;
  refundAmount: number | null;
  refundRequestedAt: string | null;
  refundedAt: string | null;
  adminMemo: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderDetailRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  order_name: string;
  course_slug: string;
  amount: number;
  method: string | null;
  status: string;
  payment_key: string | null;
  receipt_url: string | null;
  approved_at: string | null;
  refund_status: string | null;
  refund_reason: string | null;
  refund_amount: number | null;
  refund_requested_at: string | null;
  refunded_at: string | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
};

export function getAdminOrderDetail(id: string): AdminOrderDetail | null {
  const row = getDatabase()
    .prepare(
      `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.id = ?`,
    )
    .get(id) as OrderDetailRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    orderName: row.order_name,
    courseSlug: row.course_slug,
    amount: row.amount,
    method: row.method ?? "",
    status: row.status,
    paymentKey: row.payment_key,
    receiptUrl: row.receipt_url,
    approvedAt: row.approved_at,
    refundStatus: row.refund_status ?? "none",
    refundReason: row.refund_reason,
    refundAmount: row.refund_amount,
    refundRequestedAt: row.refund_requested_at,
    refundedAt: row.refunded_at,
    adminMemo: row.admin_memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================================================
// 회원 상태 변경 + 회원 상세
// ============================================================================

export type MemberStatus = "active" | "blocked" | "deleted";
const VALID_MEMBER_STATUSES: readonly MemberStatus[] = ["active", "blocked", "deleted"];

export function isValidMemberStatus(value: unknown): value is MemberStatus {
  return typeof value === "string" && (VALID_MEMBER_STATUSES as readonly string[]).includes(value);
}

export function updateMemberStatus(id: string, status: MemberStatus) {
  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM "USER" WHERE id = ?`).get(id);
  if (!existing) return { ok: false as const, message: "회원을 찾을 수 없습니다." };

  db
    .prepare(`UPDATE "USER" SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, new Date().toISOString(), id);

  // 차단/탈퇴 시 활성 세션 모두 삭제
  if (status === "blocked" || status === "deleted") {
    db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(id);
  }

  return { ok: true as const };
}

export type AdminMemberBase = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminMemberPurchase = {
  courseSlug: string;
  courseTitle: string;
  purchasedAt: string;
  amount: number;
  paymentStatus: string;
  accessStatus: string;
};

export type AdminMemberOrder = {
  id: string;
  orderName: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

export type AdminMemberDetail = {
  base: AdminMemberBase;
  purchases: AdminMemberPurchase[];
  orders: AdminMemberOrder[];
  inquiries: AdminInquiry[];
  reviews: AdminReview[];
};

type UserDetailRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at: string | null;
};

export function getAdminMemberDetail(id: string): AdminMemberDetail | null {
  const db = getDatabase();
  const userRow = db
    .prepare(
      `SELECT id, name, email, role, status, created_at, last_login_at
       FROM "USER" WHERE id = ?`,
    )
    .get(id) as UserDetailRow | undefined;
  if (!userRow) return null;

  const purchaseRows = db
    .prepare(
      `SELECT
         cp.course_slug, cp.purchased_at, cp.access_status,
         COALESCE(c.title, cp.course_slug) AS course_title,
         (SELECT o.status FROM orders o
          WHERE o.user_id = cp.user_id AND o.course_slug = cp.course_slug
          ORDER BY o.created_at DESC LIMIT 1) AS payment_status,
         (SELECT o.amount FROM orders o
          WHERE o.user_id = cp.user_id AND o.course_slug = cp.course_slug
          ORDER BY o.created_at DESC LIMIT 1) AS amount
       FROM course_purchases cp
       LEFT JOIN courses c ON c.slug = cp.course_slug
       WHERE cp.user_id = ?
       ORDER BY cp.purchased_at DESC`,
    )
    .all(id) as Array<{
      course_slug: string;
      course_title: string;
      purchased_at: string;
      access_status: string;
      payment_status: string | null;
      amount: number | null;
    }>;

  const orderRows = db
    .prepare(
      `SELECT id, order_name, amount, method, status, created_at, approved_at
       FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(id) as Array<{
      id: string;
      order_name: string;
      amount: number;
      method: string | null;
      status: string;
      created_at: string;
      approved_at: string | null;
    }>;

  return {
    base: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      status: userRow.status,
      createdAt: userRow.created_at,
      lastLoginAt: userRow.last_login_at,
    },
    purchases: purchaseRows.map((r) => ({
      courseSlug: r.course_slug,
      courseTitle: r.course_title,
      purchasedAt: r.purchased_at,
      amount: r.amount ?? 0,
      paymentStatus: r.payment_status ?? "-",
      accessStatus: r.access_status,
    })),
    orders: orderRows.map((r) => ({
      id: r.id,
      orderName: r.order_name,
      amount: r.amount,
      method: r.method ?? "",
      status: r.status,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
    })),
    inquiries: listInquiriesForUser(id),
    reviews: listReviewsForUser(id),
  };
}

// ============================================================================
// 강의별 판매 통계
// ============================================================================

export type CourseSalesStats = {
  totalSales: number;
  totalRevenue: number;
  refundCount: number;
  refundAmount: number;
  netRevenue: number;
  uniqueBuyers: number;
  recentPurchases: Array<{
    userName: string;
    userEmail: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  monthly: Array<{ month: string; count: number; revenue: number }>;
};

export function getCourseSalesStats(slug: string): CourseSalesStats {
  const db = getDatabase();

  const totalSales = (
    db
      .prepare(`SELECT count(*) AS c FROM orders WHERE course_slug = ? AND status = 'paid'`)
      .get(slug) as CountRow
  ).c;

  const totalRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE course_slug = ? AND status = 'paid'`,
      )
      .get(slug) as TotalRow
  ).total;

  const refundCount = (
    db
      .prepare(`SELECT count(*) AS c FROM orders WHERE course_slug = ? AND status = 'refunded'`)
      .get(slug) as CountRow
  ).c;

  const refundAmount = (
    db
      .prepare(
        `SELECT COALESCE(SUM(COALESCE(refund_amount, amount)), 0) AS total
         FROM orders WHERE course_slug = ? AND status = 'refunded'`,
      )
      .get(slug) as TotalRow
  ).total;

  const uniqueBuyers = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT user_id) AS c FROM orders WHERE course_slug = ? AND status = 'paid'`,
      )
      .get(slug) as CountRow
  ).c;

  const recentRows = db
    .prepare(
      `SELECT o.amount, o.status, o.created_at, u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.course_slug = ?
       ORDER BY o.created_at DESC LIMIT 10`,
    )
    .all(slug) as Array<{
      amount: number;
      status: string;
      created_at: string;
      user_name: string;
      user_email: string;
    }>;

  const monthlyRows = db
    .prepare(
      `SELECT substr(created_at, 1, 7) AS month,
              count(*) AS count,
              COALESCE(SUM(amount), 0) AS revenue
       FROM orders
       WHERE course_slug = ? AND status = 'paid'
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
    )
    .all(slug) as Array<{ month: string; count: number; revenue: number }>;

  return {
    totalSales,
    totalRevenue,
    refundCount,
    refundAmount,
    netRevenue: totalRevenue - refundAmount,
    uniqueBuyers,
    recentPurchases: recentRows.map((r) => ({
      userName: r.user_name,
      userEmail: r.user_email,
      amount: r.amount,
      status: r.status,
      createdAt: r.created_at,
    })),
    monthly: monthlyRows.reverse(),
  };
}

// ============================================================================
// 대시보드 확장 데이터
// ============================================================================

export type DashboardExtras = {
  pendingInquiries: number;
  refundRequests: number;
  hiddenReviews: number;
  monthRevenue: number;
  monthRefund: number;
  monthNetRevenue: number;
  recentInquiries: AdminInquiry[];
  recentRefundRequests: Array<{
    id: string;
    userName: string;
    userEmail: string;
    orderName: string;
    amount: number;
    refundRequestedAt: string | null;
  }>;
  recentReviews: AdminReview[];
  topCourses: Array<{
    slug: string;
    title: string;
    salesCount: number;
    revenue: number;
  }>;
};

export function getDashboardExtras(): DashboardExtras {
  const db = getDatabase();

  const pendingInquiries = (
    db.prepare(`SELECT count(*) AS c FROM inquiries WHERE status = 'pending'`).get() as CountRow
  ).c;
  const refundRequests = (
    db.prepare(`SELECT count(*) AS c FROM orders WHERE status = 'refund_requested'`).get() as CountRow
  ).c;
  const hiddenReviews = (
    db.prepare(`SELECT count(*) AS c FROM course_reviews WHERE status = 'hidden'`).get() as CountRow
  ).c;

  const monthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM orders
         WHERE status = 'paid' AND substr(COALESCE(approved_at, created_at), 1, 7) = ?`,
      )
      .get(monthPrefix) as TotalRow
  ).total;

  const monthRefund = (
    db
      .prepare(
        `SELECT COALESCE(SUM(COALESCE(refund_amount, amount)), 0) AS total FROM orders
         WHERE status = 'refunded' AND substr(COALESCE(refunded_at, updated_at), 1, 7) = ?`,
      )
      .get(monthPrefix) as TotalRow
  ).total;

  const recentInquiries = db
    .prepare(`SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 5`)
    .all() as InquiryRow[];

  const recentRefundRows = db
    .prepare(
      `SELECT o.id, o.order_name, o.amount, o.refund_requested_at,
              u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.status = 'refund_requested'
       ORDER BY o.refund_requested_at DESC LIMIT 5`,
    )
    .all() as Array<{
      id: string;
      order_name: string;
      amount: number;
      refund_requested_at: string | null;
      user_name: string;
      user_email: string;
    }>;

  const recentReviewRows = db
    .prepare(`${ADMIN_REVIEW_SELECT} ORDER BY r.created_at DESC LIMIT 5`)
    .all() as ReviewAdminRow[];

  const topCourseRows = db
    .prepare(
      `SELECT o.course_slug AS slug,
              COALESCE(c.title, o.course_slug) AS title,
              count(*) AS sales_count,
              COALESCE(SUM(o.amount), 0) AS revenue
       FROM orders o
       LEFT JOIN courses c ON c.slug = o.course_slug
       WHERE o.status = 'paid'
       GROUP BY o.course_slug
       ORDER BY sales_count DESC
       LIMIT 5`,
    )
    .all() as Array<{ slug: string; title: string; sales_count: number; revenue: number }>;

  return {
    pendingInquiries,
    refundRequests,
    hiddenReviews,
    monthRevenue,
    monthRefund,
    monthNetRevenue: monthRevenue - monthRefund,
    recentInquiries: recentInquiries.map(rowToInquiry),
    recentRefundRequests: recentRefundRows.map((r) => ({
      id: r.id,
      userName: r.user_name,
      userEmail: r.user_email,
      orderName: r.order_name,
      amount: r.amount,
      refundRequestedAt: r.refund_requested_at,
    })),
    recentReviews: recentReviewRows.map(rowToAdminReview),
    topCourses: topCourseRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      salesCount: r.sales_count,
      revenue: r.revenue,
    })),
  };
}

// 다른 곳에서 라벨이 필요할 수 있어서 re-export
export { ORDER_STATUS_LABELS };
