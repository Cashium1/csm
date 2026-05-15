import { randomUUID } from "node:crypto";
import { removeCourseFromCart } from "@/lib/course-library";
import { courses, getCourse, type Course } from "@/lib/data";
import { getDatabase } from "@/lib/db";

type CourseSlugRow = {
  course_slug: string;
};

export function hasPurchasedCourse(userId: string, courseSlug: string) {
  const row = getDatabase()
    .prepare(`
      SELECT course_slug
      FROM course_purchases
      WHERE user_id = ?
        AND course_slug = ?
      LIMIT 1
    `)
    .get(userId, courseSlug) as CourseSlugRow | undefined;

  return Boolean(row);
}

export function hasEnrolledCourse(userId: string, courseSlug: string) {
  const row = getDatabase()
    .prepare(`
      SELECT course_slug
      FROM course_enrollments
      WHERE user_id = ?
        AND course_slug = ?
      LIMIT 1
    `)
    .get(userId, courseSlug) as CourseSlugRow | undefined;

  return Boolean(row);
}

export function hasCourseAccess(userId: string, courseSlug: string) {
  return hasPurchasedCourse(userId, courseSlug) || hasEnrolledCourse(userId, courseSlug);
}

export function enrollFreeCourse(userId: string, courseSlug: string) {
  const course = getCourse(courseSlug);

  if (!course || course.priceNumber !== 0) {
    return { ok: false as const, message: "무료 강의만 바로 수강할 수 있습니다." };
  }

  const now = new Date().toISOString();

  getDatabase()
    .prepare(`
      INSERT INTO course_enrollments (
        id,
        user_id,
        course_slug,
        enrolled_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, course_slug) DO NOTHING
    `)
    .run(randomUUID(), userId, courseSlug, now);

  removeCourseFromCart(userId, courseSlug);

  return { ok: true as const };
}

export function purchaseCourse(userId: string, courseSlug: string) {
  const course = getCourse(courseSlug);

  if (!course) {
    return { ok: false as const, message: "강의를 찾을 수 없습니다." };
  }

  if (course.priceNumber === 0) {
    return enrollFreeCourse(userId, courseSlug);
  }

  const now = new Date().toISOString();

  getDatabase()
    .prepare(`
      INSERT INTO course_purchases (
        id,
        user_id,
        course_slug,
        purchased_at
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, course_slug) DO NOTHING
    `)
    .run(randomUUID(), userId, courseSlug, now);

  removeCourseFromCart(userId, courseSlug);

  return { ok: true as const };
}

export function getAccessibleCoursesForUser(userId: string) {
  const purchasedRows = getDatabase()
    .prepare(`
      SELECT course_slug
      FROM course_purchases
      WHERE user_id = ?
      ORDER BY purchased_at DESC
    `)
    .all(userId) as CourseSlugRow[];
  const enrolledRows = getDatabase()
    .prepare(`
      SELECT course_slug
      FROM course_enrollments
      WHERE user_id = ?
      ORDER BY enrolled_at DESC
    `)
    .all(userId) as CourseSlugRow[];

  const accessibleSlugs = new Set([
    ...purchasedRows.map((row) => row.course_slug),
    ...enrolledRows.map((row) => row.course_slug),
  ]);

  return courses.filter((course): course is Course => accessibleSlugs.has(course.slug));
}

export const getPurchasedCoursesForUser = getAccessibleCoursesForUser;
