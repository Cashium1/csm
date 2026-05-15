import { randomUUID } from "node:crypto";
import { courses, getCourse, type Course } from "@/lib/data";
import { getDatabase } from "@/lib/db";

type CourseRow = {
  slug: string;
  title: string;
  category: string;
  group_key: Course["group"];
  summary: string;
  level: Course["level"];
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
};

type CourseStateRow = CourseRow & {
  state_at: string;
  access_type?: "purchase" | "free";
};

type CartRow = CourseRow & {
  carted_at: string;
};

type PaymentRow = CourseRow & {
  purchased_at: string;
};

type SlugRow = {
  course_slug: string;
};

export type CourseListItem = Course & {
  stateAt: string;
  accessType?: "purchase" | "free";
};

export type CartCourseItem = Course & {
  cartedAt: string;
};

export type PaymentHistoryItem = Course & {
  purchasedAt: string;
};

export function syncCoursesToDatabase() {
  const database = getDatabase();
  const now = new Date().toISOString();
  const statement = database.prepare(`
    INSERT INTO courses (
      slug,
      title,
      category,
      group_key,
      summary,
      level,
      duration,
      minutes,
      price,
      price_number,
      thumbnail,
      material_pdf,
      badge,
      card_category,
      original_price,
      rating,
      review_count,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      category = excluded.category,
      group_key = excluded.group_key,
      summary = excluded.summary,
      level = excluded.level,
      duration = excluded.duration,
      minutes = excluded.minutes,
      price = excluded.price,
      price_number = excluded.price_number,
      thumbnail = excluded.thumbnail,
      material_pdf = excluded.material_pdf,
      badge = excluded.badge,
      card_category = excluded.card_category,
      original_price = excluded.original_price,
      rating = excluded.rating,
      review_count = excluded.review_count,
      updated_at = excluded.updated_at
  `);

  for (const course of courses) {
    statement.run(
      course.slug,
      course.title,
      course.category,
      course.group,
      course.summary,
      course.level,
      course.duration,
      course.minutes,
      course.price,
      course.priceNumber,
      course.thumbnail,
      course.materialPdf,
      course.badge,
      course.cardCategory,
      course.originalPrice,
      course.rating,
      course.reviewCount,
      now,
    );
  }
}

export function hasCartedCourse(userId: string, courseSlug: string) {
  syncCoursesToDatabase();

  const row = getDatabase()
    .prepare(`
      SELECT course_slug
      FROM course_cart_items
      WHERE user_id = ?
        AND course_slug = ?
      LIMIT 1
    `)
    .get(userId, courseSlug) as SlugRow | undefined;

  return Boolean(row);
}

export function addCourseToCart(userId: string, courseSlug: string) {
  syncCoursesToDatabase();

  const course = getCourse(courseSlug);

  if (!course) {
    return { ok: false as const, message: "강의를 찾을 수 없습니다." };
  }

  if (hasActiveCourseRecord(userId, courseSlug)) {
    return { ok: false as const, message: "이미 수강 중인 강의입니다." };
  }

  getDatabase()
    .prepare(`
      INSERT INTO course_cart_items (
        id,
        user_id,
        course_slug,
        created_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, course_slug) DO NOTHING
    `)
    .run(randomUUID(), userId, courseSlug, new Date().toISOString());

  return { ok: true as const };
}

export function removeCourseFromCart(userId: string, courseSlug: string) {
  getDatabase()
    .prepare(`
      DELETE FROM course_cart_items
      WHERE user_id = ?
        AND course_slug = ?
    `)
    .run(userId, courseSlug);
}

export function completeCourse(userId: string, courseSlug: string) {
  syncCoursesToDatabase();

  const course = getCourse(courseSlug);

  if (!course) {
    return { ok: false as const, message: "강의를 찾을 수 없습니다." };
  }

  if (!hasActiveCourseRecord(userId, courseSlug)) {
    return { ok: false as const, message: "수강 중인 강의만 완료할 수 있습니다." };
  }

  getDatabase()
    .prepare(`
      INSERT INTO course_completions (
        id,
        user_id,
        course_slug,
        completed_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, course_slug) DO UPDATE SET
        completed_at = excluded.completed_at
    `)
    .run(randomUUID(), userId, courseSlug, new Date().toISOString());

  removeCourseFromCart(userId, courseSlug);

  return { ok: true as const };
}

export function getCartCoursesForUser(userId: string) {
  syncCoursesToDatabase();

  const rows = getDatabase()
    .prepare(`
      SELECT
        c.*,
        ci.created_at AS carted_at
      FROM course_cart_items ci
      INNER JOIN courses c ON c.slug = ci.course_slug
      WHERE ci.user_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM course_purchases cp
          WHERE cp.user_id = ci.user_id
            AND cp.course_slug = ci.course_slug
        )
        AND NOT EXISTS (
          SELECT 1 FROM course_enrollments ce
          WHERE ce.user_id = ci.user_id
            AND ce.course_slug = ci.course_slug
        )
      ORDER BY ci.created_at DESC
    `)
    .all(userId) as CartRow[];

  return rows.map((row) => ({
    ...rowToCourse(row),
    cartedAt: row.carted_at,
  }));
}

export function getInProgressCoursesForUser(userId: string) {
  syncCoursesToDatabase();

  const rows = getDatabase()
    .prepare(`
      SELECT *
      FROM (
        SELECT
          c.*,
          cp.purchased_at AS state_at,
          'purchase' AS access_type
        FROM course_purchases cp
        INNER JOIN courses c ON c.slug = cp.course_slug
        WHERE cp.user_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM course_completions cc
            WHERE cc.user_id = cp.user_id
              AND cc.course_slug = cp.course_slug
          )

        UNION ALL

        SELECT
          c.*,
          ce.enrolled_at AS state_at,
          'free' AS access_type
        FROM course_enrollments ce
        INNER JOIN courses c ON c.slug = ce.course_slug
        WHERE ce.user_id = ?
          AND NOT EXISTS (
            SELECT 1 FROM course_completions cc
            WHERE cc.user_id = ce.user_id
              AND cc.course_slug = ce.course_slug
          )
      )
      ORDER BY state_at DESC
    `)
    .all(userId, userId) as CourseStateRow[];

  return rows.map((row) => ({
    ...rowToCourse(row),
    stateAt: row.state_at,
    accessType: row.access_type,
  }));
}

export function getCompletedCoursesForUser(userId: string) {
  syncCoursesToDatabase();

  const rows = getDatabase()
    .prepare(`
      SELECT
        c.*,
        cc.completed_at AS state_at
      FROM course_completions cc
      INNER JOIN courses c ON c.slug = cc.course_slug
      WHERE cc.user_id = ?
      ORDER BY cc.completed_at DESC
    `)
    .all(userId) as CourseStateRow[];

  return rows.map((row) => ({
    ...rowToCourse(row),
    stateAt: row.state_at,
  }));
}

export function getPaymentHistoryForUser(userId: string) {
  syncCoursesToDatabase();

  const rows = getDatabase()
    .prepare(`
      SELECT
        c.*,
        cp.purchased_at
      FROM course_purchases cp
      INNER JOIN courses c ON c.slug = cp.course_slug
      WHERE cp.user_id = ?
      ORDER BY cp.purchased_at DESC
    `)
    .all(userId) as PaymentRow[];

  return rows.map((row) => ({
    ...rowToCourse(row),
    purchasedAt: row.purchased_at,
  }));
}

function hasActiveCourseRecord(userId: string, courseSlug: string) {
  const row = getDatabase()
    .prepare(`
      SELECT course_slug FROM course_purchases
      WHERE user_id = ?
        AND course_slug = ?
      UNION
      SELECT course_slug FROM course_enrollments
      WHERE user_id = ?
        AND course_slug = ?
      LIMIT 1
    `)
    .get(userId, courseSlug, userId, courseSlug) as SlugRow | undefined;

  return Boolean(row);
}

function rowToCourse(row: CourseRow): Course {
  const sourceCourse = getCourse(row.slug);

  if (!sourceCourse) {
    throw new Error(`Unknown course row: ${row.slug}`);
  }

  return {
    ...sourceCourse,
    title: row.title,
    category: row.category,
    group: row.group_key,
    summary: row.summary,
    level: row.level,
    duration: row.duration,
    minutes: row.minutes,
    price: row.price,
    priceNumber: row.price_number,
    thumbnail: row.thumbnail,
    materialPdf: row.material_pdf,
    badge: row.badge,
    cardCategory: row.card_category,
    originalPrice: row.original_price,
    rating: row.rating,
    reviewCount: row.review_count,
  };
}
