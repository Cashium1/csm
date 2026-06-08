import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";

export type CouponDiscountType = "fixed_amount" | "percentage";
export type CouponStatus = "active" | "inactive" | "expired";

export type Coupon = {
  id: string;
  name: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  appliesToAllCourses: boolean;
  applicableCourseIds: string[];
  applicableCategoryIds: string[];
  usageLimit: number | null;
  usedCount: number;
  userLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
};

type CouponRow = {
  id: string;
  name: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  applies_to_all_courses: number;
  applicable_course_ids: string;
  applicable_category_ids: string;
  usage_limit: number | null;
  used_count: number;
  user_limit: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function parseList(s: string): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
}

function rowToCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    discountType: (row.discount_type === "fixed_amount" ? "fixed_amount" : "percentage"),
    discountValue: row.discount_value,
    maxDiscountAmount: row.max_discount_amount,
    minOrderAmount: row.min_order_amount,
    appliesToAllCourses: row.applies_to_all_courses === 1,
    applicableCourseIds: parseList(row.applicable_course_ids),
    applicableCategoryIds: parseList(row.applicable_category_ids),
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    userLimit: row.user_limit,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: (row.status === "active"
      ? "active"
      : row.status === "expired"
        ? "expired"
        : "inactive"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CouponInput = {
  name: string;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  appliesToAllCourses: boolean;
  applicableCourseIds: string[];
  applicableCategoryIds: string[];
  usageLimit: number | null;
  userLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  status: CouponStatus;
};

export function listAdminCoupons(): Coupon[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM coupons ORDER BY created_at DESC`)
    .all() as CouponRow[];
  return rows.map(rowToCoupon);
}

export function getAdminCoupon(id: string): Coupon | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM coupons WHERE id = ?`)
    .get(id) as CouponRow | undefined;
  return row ? rowToCoupon(row) : null;
}

export function getCouponByCode(code: string): Coupon | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM coupons WHERE LOWER(code) = LOWER(?)`)
    .get(code) as CouponRow | undefined;
  return row ? rowToCoupon(row) : null;
}

export function createAdminCoupon(input: CouponInput) {
  const code = input.code.trim();
  if (!code) return { ok: false as const, message: "쿠폰 코드를 입력해 주세요." };
  if (!input.name.trim()) return { ok: false as const, message: "쿠폰명을 입력해 주세요." };

  const existing = getDatabase()
    .prepare(`SELECT id FROM coupons WHERE LOWER(code) = LOWER(?)`)
    .get(code);
  if (existing) return { ok: false as const, message: "이미 사용 중인 쿠폰 코드입니다." };

  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO coupons (
        id, name, code, discount_type, discount_value, max_discount_amount, min_order_amount,
        applies_to_all_courses, applicable_course_ids, applicable_category_ids,
        usage_limit, used_count, user_limit, starts_at, ends_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.name.trim(),
      code,
      input.discountType,
      input.discountValue,
      input.maxDiscountAmount,
      input.minOrderAmount,
      input.appliesToAllCourses ? 1 : 0,
      JSON.stringify(input.applicableCourseIds),
      JSON.stringify(input.applicableCategoryIds),
      input.usageLimit,
      input.userLimit,
      input.startsAt,
      input.endsAt,
      input.status,
      now,
      now,
    );
  return { ok: true as const, id };
}

export function updateAdminCoupon(id: string, input: CouponInput) {
  const existing = getAdminCoupon(id);
  if (!existing) return { ok: false as const, message: "쿠폰을 찾을 수 없습니다." };

  // code 충돌 검사
  if (input.code.toLowerCase() !== existing.code.toLowerCase()) {
    const dup = getDatabase()
      .prepare(`SELECT id FROM coupons WHERE LOWER(code) = LOWER(?) AND id != ?`)
      .get(input.code, id);
    if (dup) return { ok: false as const, message: "이미 사용 중인 쿠폰 코드입니다." };
  }

  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `UPDATE coupons SET
        name = ?, code = ?, discount_type = ?, discount_value = ?, max_discount_amount = ?,
        min_order_amount = ?, applies_to_all_courses = ?, applicable_course_ids = ?,
        applicable_category_ids = ?, usage_limit = ?, user_limit = ?,
        starts_at = ?, ends_at = ?, status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.name.trim(),
      input.code.trim(),
      input.discountType,
      input.discountValue,
      input.maxDiscountAmount,
      input.minOrderAmount,
      input.appliesToAllCourses ? 1 : 0,
      JSON.stringify(input.applicableCourseIds),
      JSON.stringify(input.applicableCategoryIds),
      input.usageLimit,
      input.userLimit,
      input.startsAt,
      input.endsAt,
      input.status,
      now,
      id,
    );
  return { ok: true as const };
}

export function setCouponStatus(id: string, status: CouponStatus) {
  getDatabase()
    .prepare(`UPDATE coupons SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, new Date().toISOString(), id);
  return { ok: true as const };
}

// ============================================================================
// 쿠폰 검증 + 적용 — 서버에서만 실행
// ============================================================================

export type CouponValidation =
  | {
      ok: true;
      coupon: Coupon;
      discountAmount: number;
      finalAmount: number;
    }
  | { ok: false; message: string };

export function validateCoupon(input: {
  code: string;
  userId: string;
  courseSlug: string;
  orderAmount: number;
}): CouponValidation {
  const coupon = getCouponByCode(input.code);
  if (!coupon) return { ok: false, message: "존재하지 않는 쿠폰 코드입니다." };
  if (coupon.status !== "active") {
    return { ok: false, message: "현재 사용할 수 없는 쿠폰입니다." };
  }

  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { ok: false, message: "쿠폰 사용 가능 시작일 이전입니다." };
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    return { ok: false, message: "쿠폰 사용 가능 기간이 지났습니다." };
  }

  if (input.orderAmount < coupon.minOrderAmount) {
    return {
      ok: false,
      message: `최소 결제 금액(${coupon.minOrderAmount.toLocaleString("ko-KR")}원) 이상에서 사용할 수 있는 쿠폰입니다.`,
    };
  }

  if (
    !coupon.appliesToAllCourses &&
    coupon.applicableCourseIds.length > 0 &&
    !coupon.applicableCourseIds.includes(input.courseSlug)
  ) {
    return { ok: false, message: "이 강의에는 적용할 수 없는 쿠폰입니다." };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: "쿠폰 전체 사용 한도가 모두 소진되었습니다." };
  }

  if (coupon.userLimit > 0) {
    const used = (
      getDatabase()
        .prepare(`SELECT count(*) AS c FROM coupon_usages WHERE coupon_id = ? AND user_id = ?`)
        .get(coupon.id, input.userId) as { c: number }
    ).c;
    if (used >= coupon.userLimit) {
      return { ok: false, message: "이 쿠폰은 이미 사용하셨습니다." };
    }
  }

  // 할인 계산
  const rawDiscount =
    coupon.discountType === "fixed_amount"
      ? coupon.discountValue
      : Math.floor((input.orderAmount * coupon.discountValue) / 100);
  let discount = Math.min(rawDiscount, input.orderAmount);
  if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount > 0) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }

  return {
    ok: true,
    coupon,
    discountAmount: discount,
    finalAmount: input.orderAmount - discount,
  };
}

export function recordCouponUsage(input: {
  couponId: string;
  couponCode: string;
  userId: string;
  courseId: string;
  orderId: string;
  discountAmount: number;
}) {
  const now = new Date().toISOString();
  const db = getDatabase();

  // 멱등 처리: 같은 주문에 대해 쿠폰 사용이 이미 기록됐다면 중복 차감하지 않습니다.
  // (결제 성공 페이지 새로고침/재진입으로 두 번 호출되어도 안전)
  const already = db
    .prepare(`SELECT 1 FROM coupon_usages WHERE order_id = ? LIMIT 1`)
    .get(input.orderId);
  if (already) {
    return;
  }

  db
    .prepare(
      `INSERT INTO coupon_usages (id, coupon_id, coupon_code, user_id, course_id, order_id, discount_amount, used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      input.couponId,
      input.couponCode,
      input.userId,
      input.courseId,
      input.orderId,
      input.discountAmount,
      now,
    );
  db
    .prepare(`UPDATE coupons SET used_count = used_count + 1, updated_at = ? WHERE id = ?`)
    .run(now, input.couponId);
}
