import { randomUUID } from "node:crypto";
import { syncCoursesToDatabase } from "@/lib/course-library";
import { getDatabase } from "@/lib/db";

// ============================================================================
// 행 타입
// ============================================================================

type CountRow = { c: number };
type TotalRow = { total: number };

type CourseRow = {
  slug: string;
  title: string;
  category: string;
  group_key: string;
  summary: string;
  level: string;
  duration: string;
  minutes: number;
  price: string;
  price_number: number;
  thumbnail: string;
  material_pdf: string;
  badge: string;
  card_category: string;
  original_price: string;
  rating: number;
  review_count: number;
  updated_at: string;
  description: string;
  discount_price: number;
  recommended_for: string;
  outcomes: string;
  is_published: number;
  is_on_sale: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  role: string;
  status: string;
};

type MemberAggregateRow = UserRow & {
  purchase_count: number;
  total_spent: number;
};

type OrderRow = {
  id: string;
  order_name: string;
  course_slug: string;
  amount: number;
  method: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  user_name: string;
  user_email: string;
};

type NoticeRow = {
  id: string;
  title: string;
  content: string;
  is_published: number;
  is_pinned: number;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// 공개 타입
// ============================================================================

export type DashboardStats = {
  totalMembers: number;
  totalCourses: number;
  publishedCourses: number;
  onSaleCourses: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  todayRevenue: number;
};

export type RecentMember = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  status: string;
};

export type RecentPayment = {
  id: string;
  orderName: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  createdAt: string;
};

export type AdminCourse = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  groupKey: string;
  category: string;
  price: string;
  priceNumber: number;
  discountPrice: number;
  thumbnail: string;
  materialPdf: string;
  level: string;
  duration: string;
  recommendedFor: string;
  outcomes: string;
  isPublished: boolean;
  isOnSale: boolean;
  updatedAt: string;
};

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
  status: string;
  purchaseCount: number;
  totalSpent: number;
};

export type AdminOrder = {
  id: string;
  orderName: string;
  userName: string;
  userEmail: string;
  courseSlug: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
};

export type AdminNotice = {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicNoticeEntry = {
  id: string;
  title: string;
  date: string;
  summary: string;
  content: string[];
  isPinned: boolean;
};

export type CourseInput = {
  title: string;
  summary: string;
  description: string;
  groupKey: string;
  category: string;
  priceNumber: number;
  discountPrice: number;
  thumbnail: string;
  materialPdf: string;
  level: string;
  duration: string;
  recommendedFor: string;
  outcomes: string;
  isPublished: boolean;
  isOnSale: boolean;
};

export type NoticeInput = {
  title: string;
  content: string;
  isPublished: boolean;
  isPinned: boolean;
};

export const VALID_ORDER_STATUSES = [
  "paid",
  "failed",
  "refund_requested",
  "refunded",
  "pending",
  "canceled",
] as const;
export type AdminOrderStatus = (typeof VALID_ORDER_STATUSES)[number];

export { ORDER_STATUS_LABELS } from "@/lib/admin-constants";

// 대분류 / 상태 라벨 등 순수 상수는 클라이언트에서도 쓸 수 있도록 별도 파일에서 re-export 합니다.
// (DB를 import하는 이 파일을 클라이언트가 직접 가져가면 node:sqlite로 인해 번들이 실패합니다.)
export { COURSE_GROUPS } from "@/lib/admin-constants";

// ============================================================================
// 변환 헬퍼
// ============================================================================

function rowToAdminCourse(row: CourseRow): AdminCourse {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description ?? "",
    groupKey: row.group_key,
    category: row.category,
    price: row.price,
    priceNumber: row.price_number,
    discountPrice: row.discount_price ?? 0,
    thumbnail: row.thumbnail,
    materialPdf: row.material_pdf,
    level: row.level,
    duration: row.duration,
    recommendedFor: row.recommended_for ?? "",
    outcomes: row.outcomes ?? "",
    isPublished: row.is_published === 1,
    isOnSale: row.is_on_sale === 1,
    updatedAt: row.updated_at,
  };
}

function rowToNotice(row: NoticeRow): AdminNotice {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    isPublished: row.is_published === 1,
    isPinned: row.is_pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatPrice(n: number) {
  return n === 0 ? "무료" : `${n.toLocaleString("ko-KR")}원`;
}

// ============================================================================
// 대시보드
// ============================================================================

export function getDashboardData() {
  syncCoursesToDatabase();
  const db = getDatabase();

  const memberCount = (db.prepare(`SELECT count(*) AS c FROM "USER"`).get() as CountRow).c;
  const courseCount = (db.prepare(`SELECT count(*) AS c FROM courses`).get() as CountRow).c;
  const publishedCount = (
    db.prepare(`SELECT count(*) AS c FROM courses WHERE is_published = 1`).get() as CountRow
  ).c;
  const onSaleCount = (
    db.prepare(`SELECT count(*) AS c FROM courses WHERE is_on_sale = 1`).get() as CountRow
  ).c;

  const orderCount = (db.prepare(`SELECT count(*) AS c FROM orders`).get() as CountRow).c;
  const paidCount = (
    db.prepare(`SELECT count(*) AS c FROM orders WHERE status = 'paid'`).get() as CountRow
  ).c;
  const totalRevenue = (
    db
      .prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid'`)
      .get() as TotalRow
  ).total;

  // 오늘 매출: approved_at의 YYYY-MM-DD가 오늘인 결제 합산
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM orders
         WHERE status = 'paid' AND approved_at >= ? AND approved_at < ?`,
      )
      .get(todayPrefix, todayPrefix + "T99:99") as TotalRow
  ).total;

  const recentMembers = db
    .prepare(
      `SELECT id, name, email, created_at, role, status
       FROM "USER" ORDER BY created_at DESC LIMIT 5`,
    )
    .all() as UserRow[];

  const recentPayments = db
    .prepare(
      `SELECT o.id, o.order_name, o.course_slug, o.amount, o.method, o.status,
              o.created_at, o.approved_at, u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       ORDER BY o.created_at DESC LIMIT 5`,
    )
    .all() as OrderRow[];

  const stats: DashboardStats = {
    totalMembers: memberCount,
    totalCourses: courseCount,
    publishedCourses: publishedCount,
    onSaleCourses: onSaleCount,
    totalOrders: orderCount,
    paidOrders: paidCount,
    totalRevenue,
    todayRevenue,
  };

  return {
    stats,
    recentMembers: recentMembers.map(
      (r): RecentMember => ({
        id: r.id,
        name: r.name,
        email: r.email,
        createdAt: r.created_at,
        role: r.role,
        status: r.status,
      }),
    ),
    recentPayments: recentPayments.map(
      (p): RecentPayment => ({
        id: p.id,
        orderName: p.order_name,
        userName: p.user_name,
        userEmail: p.user_email,
        amount: p.amount,
        status: p.status,
        createdAt: p.created_at,
      }),
    ),
  };
}

// ============================================================================
// 강의 관리
// ============================================================================

export function listAdminCourses(): AdminCourse[] {
  syncCoursesToDatabase();
  const rows = getDatabase()
    .prepare(`SELECT * FROM courses ORDER BY updated_at DESC`)
    .all() as CourseRow[];
  return rows.map(rowToAdminCourse);
}

export function getAdminCourse(slug: string): AdminCourse | null {
  syncCoursesToDatabase();
  const row = getDatabase()
    .prepare(`SELECT * FROM courses WHERE slug = ?`)
    .get(slug) as CourseRow | undefined;
  return row ? rowToAdminCourse(row) : null;
}

export function createAdminCourse(slug: string, input: CourseInput) {
  const cleanSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9-]{2,80}$/.test(cleanSlug)) {
    return {
      ok: false as const,
      message: "슬러그는 영문 소문자, 숫자, 하이픈만 사용해 2~80자로 입력해 주세요.",
    };
  }
  if (!input.title.trim()) {
    return { ok: false as const, message: "제목을 입력해 주세요." };
  }

  syncCoursesToDatabase();
  const db = getDatabase();
  const existing = db.prepare(`SELECT slug FROM courses WHERE slug = ?`).get(cleanSlug);
  if (existing) {
    return { ok: false as const, message: "이미 사용 중인 슬러그입니다." };
  }

  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO courses (
      slug, title, category, group_key, summary, level, duration, minutes,
      price, price_number, thumbnail, material_pdf, badge, card_category,
      original_price, rating, review_count, updated_at,
      description, discount_price, recommended_for, outcomes, is_published, is_on_sale
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    cleanSlug,
    input.title.trim(),
    input.category,
    input.groupKey,
    input.summary,
    input.level,
    input.duration,
    0,
    formatPrice(input.priceNumber),
    input.priceNumber,
    input.thumbnail,
    input.materialPdf,
    "신규",
    input.category,
    formatPrice(input.priceNumber),
    0,
    0,
    now,
    input.description,
    input.discountPrice,
    input.recommendedFor,
    input.outcomes,
    input.isPublished ? 1 : 0,
    input.isOnSale ? 1 : 0,
  );

  return { ok: true as const, slug: cleanSlug };
}

export function updateAdminCourse(slug: string, input: CourseInput) {
  syncCoursesToDatabase();
  const db = getDatabase();
  const existing = db.prepare(`SELECT slug FROM courses WHERE slug = ?`).get(slug);
  if (!existing) {
    return { ok: false as const, message: "강의를 찾을 수 없습니다." };
  }
  if (!input.title.trim()) {
    return { ok: false as const, message: "제목을 입력해 주세요." };
  }

  db.prepare(
    `
    UPDATE courses SET
      title = ?, summary = ?, description = ?, group_key = ?, category = ?,
      card_category = ?, price = ?, price_number = ?, discount_price = ?,
      thumbnail = ?, material_pdf = ?, level = ?, duration = ?,
      recommended_for = ?, outcomes = ?, is_published = ?, is_on_sale = ?,
      updated_at = ?
    WHERE slug = ?
  `,
  ).run(
    input.title.trim(),
    input.summary,
    input.description,
    input.groupKey,
    input.category,
    input.category,
    formatPrice(input.priceNumber),
    input.priceNumber,
    input.discountPrice,
    input.thumbnail,
    input.materialPdf,
    input.level,
    input.duration,
    input.recommendedFor,
    input.outcomes,
    input.isPublished ? 1 : 0,
    input.isOnSale ? 1 : 0,
    new Date().toISOString(),
    slug,
  );

  return { ok: true as const };
}

export function setCoursePublished(slug: string, value: boolean) {
  getDatabase()
    .prepare(`UPDATE courses SET is_published = ?, updated_at = ? WHERE slug = ?`)
    .run(value ? 1 : 0, new Date().toISOString(), slug);
}

export function setCourseOnSale(slug: string, value: boolean) {
  getDatabase()
    .prepare(`UPDATE courses SET is_on_sale = ?, updated_at = ? WHERE slug = ?`)
    .run(value ? 1 : 0, new Date().toISOString(), slug);
}

// 구매 이력이 있으면 완전 삭제 대신 비공개+판매중지로 전환합니다.
export function deleteAdminCourse(slug: string) {
  const db = getDatabase();
  const purchaseCount = (
    db
      .prepare(`SELECT count(*) AS c FROM course_purchases WHERE course_slug = ?`)
      .get(slug) as CountRow
  ).c;

  if (purchaseCount > 0) {
    db
      .prepare(
        `UPDATE courses SET is_published = 0, is_on_sale = 0, updated_at = ? WHERE slug = ?`,
      )
      .run(new Date().toISOString(), slug);
    return { ok: true as const, softDeleted: true };
  }

  db.prepare(`DELETE FROM courses WHERE slug = ?`).run(slug);
  return { ok: true as const, softDeleted: false };
}

// 강의가 공개 사이트에 노출 가능한 published 슬러그 집합
export function getPublishedCourseSlugs(): Set<string> {
  const rows = getDatabase()
    .prepare(`SELECT slug FROM courses WHERE is_published = 1`)
    .all() as Array<{ slug: string }>;
  return new Set(rows.map((r) => r.slug));
}

// ============================================================================
// 회원 관리
// ============================================================================

export function listAdminMembers(): AdminMember[] {
  const rows = getDatabase()
    .prepare(
      `SELECT
         u.id, u.name, u.email, u.created_at, u.role, u.status,
         COALESCE((SELECT COUNT(*) FROM course_purchases cp WHERE cp.user_id = u.id), 0) AS purchase_count,
         COALESCE((SELECT SUM(o.amount) FROM orders o WHERE o.user_id = u.id AND o.status = 'paid'), 0) AS total_spent
       FROM "USER" u
       ORDER BY u.created_at DESC`,
    )
    .all() as MemberAggregateRow[];

  return rows.map(
    (r): AdminMember => ({
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: r.created_at,
      role: r.role,
      status: r.status,
      purchaseCount: r.purchase_count,
      totalSpent: r.total_spent,
    }),
  );
}

// ============================================================================
// 결제 관리
// ============================================================================

export function listAdminOrders(): AdminOrder[] {
  const rows = getDatabase()
    .prepare(
      `SELECT o.id, o.order_name, o.course_slug, o.amount, o.method, o.status,
              o.created_at, o.approved_at, u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       ORDER BY o.created_at DESC`,
    )
    .all() as OrderRow[];
  return rows.map(
    (r): AdminOrder => ({
      id: r.id,
      orderName: r.order_name,
      userName: r.user_name,
      userEmail: r.user_email,
      courseSlug: r.course_slug,
      amount: r.amount,
      method: r.method ?? "",
      status: r.status,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
    }),
  );
}

export function getAdminOrder(id: string): AdminOrder | null {
  const row = getDatabase()
    .prepare(
      `SELECT o.id, o.order_name, o.course_slug, o.amount, o.method, o.status,
              o.created_at, o.approved_at, u.name AS user_name, u.email AS user_email
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.id = ?`,
    )
    .get(id) as OrderRow | undefined;
  if (!row) return null;
  return {
    id: row.id,
    orderName: row.order_name,
    userName: row.user_name,
    userEmail: row.user_email,
    courseSlug: row.course_slug,
    amount: row.amount,
    method: row.method ?? "",
    status: row.status,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

export function updateOrderStatus(id: string, status: AdminOrderStatus) {
  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM orders WHERE id = ?`).get(id);
  if (!existing) {
    return { ok: false as const, message: "주문을 찾을 수 없습니다." };
  }
  db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`).run(
    status,
    new Date().toISOString(),
    id,
  );
  return { ok: true as const };
}

// ============================================================================
// 공지사항 관리
// ============================================================================

export function listAdminNotices(): AdminNotice[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM notices ORDER BY is_pinned DESC, created_at DESC`)
    .all() as NoticeRow[];
  return rows.map(rowToNotice);
}

export function getAdminNotice(id: string): AdminNotice | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM notices WHERE id = ?`)
    .get(id) as NoticeRow | undefined;
  return row ? rowToNotice(row) : null;
}

export function createAdminNotice(input: NoticeInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) return { ok: false as const, message: "제목을 입력해 주세요." };
  if (!content) return { ok: false as const, message: "내용을 입력해 주세요." };

  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO notices (id, title, content, is_published, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id, title, content, input.isPublished ? 1 : 0, input.isPinned ? 1 : 0, now, now);
  return { ok: true as const, id };
}

export function updateAdminNotice(id: string, input: NoticeInput) {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) return { ok: false as const, message: "제목을 입력해 주세요." };
  if (!content) return { ok: false as const, message: "내용을 입력해 주세요." };

  const db = getDatabase();
  const existing = db.prepare(`SELECT id FROM notices WHERE id = ?`).get(id);
  if (!existing) return { ok: false as const, message: "공지를 찾을 수 없습니다." };

  db
    .prepare(
      `UPDATE notices SET title = ?, content = ?, is_published = ?, is_pinned = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(title, content, input.isPublished ? 1 : 0, input.isPinned ? 1 : 0, new Date().toISOString(), id);
  return { ok: true as const };
}

export function deleteAdminNotice(id: string) {
  getDatabase().prepare(`DELETE FROM notices WHERE id = ?`).run(id);
  return { ok: true as const };
}

// ============================================================================
// 공개 사이트용 공지
// ============================================================================

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatNoticeDate(iso: string): string {
  const parts = dateFormatter.formatToParts(new Date(iso));
  const part = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // Intl가 반환하는 '2026. 05. 23.' 형식에서 숫자만 추출해 다듬습니다.
  return `${part("year")}.${part("month")}.${part("day")}`;
}

export function listPublicNotices(): PublicNoticeEntry[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM notices WHERE is_published = 1
       ORDER BY is_pinned DESC, created_at DESC`,
    )
    .all() as NoticeRow[];
  return rows.map((r) => {
    const paragraphs = r.content
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      id: r.id,
      title: r.title,
      date: formatNoticeDate(r.created_at),
      summary: paragraphs[0] ?? "",
      content: paragraphs.length > 0 ? paragraphs : [r.content],
      isPinned: r.is_pinned === 1,
    };
  });
}
