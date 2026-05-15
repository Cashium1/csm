import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";

export type CourseReview = {
  id: string;
  courseSlug: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewRow = {
  id: string;
  course_slug: string;
  user_id: string;
  user_name: string;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
};

type ReviewFields = {
  rating?: number;
  content?: string;
  errors: {
    rating?: string;
    content?: string;
  };
  isValid: boolean;
};

export function getCourseReviews(courseSlug: string) {
  const rows = getDatabase()
    .prepare(`
      SELECT
        r.id,
        r.course_slug,
        r.user_id,
        u.name AS user_name,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at
      FROM course_reviews r
      INNER JOIN "USER" u ON u.id = r.user_id
      WHERE r.course_slug = ?
      ORDER BY r.updated_at DESC
    `)
    .all(courseSlug) as ReviewRow[];

  return rows.map(toCourseReview);
}

export function getUserCourseReview(courseSlug: string, userId: string) {
  const row = getDatabase()
    .prepare(`
      SELECT
        r.id,
        r.course_slug,
        r.user_id,
        u.name AS user_name,
        r.rating,
        r.content,
        r.created_at,
        r.updated_at
      FROM course_reviews r
      INNER JOIN "USER" u ON u.id = r.user_id
      WHERE r.course_slug = ?
        AND r.user_id = ?
      LIMIT 1
    `)
    .get(courseSlug, userId) as ReviewRow | undefined;

  return row ? toCourseReview(row) : null;
}

export function validateReviewFields(ratingValue: unknown, contentValue: unknown): ReviewFields {
  const rating = typeof ratingValue === "number" ? ratingValue : Number(ratingValue);
  const content = typeof contentValue === "string" ? contentValue.trim() : "";
  const errors: ReviewFields["errors"] = {};

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "평점은 1점부터 5점까지 선택해 주세요.";
  }

  if (content.length < 10) {
    errors.content = "후기는 10자 이상 입력해 주세요.";
  } else if (content.length > 800) {
    errors.content = "후기는 800자 이하로 입력해 주세요.";
  }

  return {
    rating: Number.isInteger(rating) ? rating : undefined,
    content,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function upsertCourseReview({
  courseSlug,
  userId,
  rating,
  content,
}: {
  courseSlug: string;
  userId: string;
  rating: number;
  content: string;
}) {
  const now = new Date().toISOString();

  getDatabase()
    .prepare(`
      INSERT INTO course_reviews (
        id,
        course_slug,
        user_id,
        rating,
        content,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, course_slug) DO UPDATE SET
        rating = excluded.rating,
        content = excluded.content,
        updated_at = excluded.updated_at
    `)
    .run(randomUUID(), courseSlug, userId, rating, content, now, now);

  return getUserCourseReview(courseSlug, userId);
}

function toCourseReview(row: ReviewRow): CourseReview {
  return {
    id: row.id,
    courseSlug: row.course_slug,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
