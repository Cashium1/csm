import { syncCoursesToDatabase } from "@/lib/course-library";
import { getCourse as getStaticCourse, type Course } from "@/lib/data";
import { getDatabase } from "@/lib/db";

// 공개 사이트에서 사용하는 강의 타입.
// 기본은 lib/data.ts의 정적 Course에서 가져오되,
// 관리자가 DB에서 수정한 값(제목/요약/가격/공개·판매 상태 등)으로 덮어씁니다.
export type PublicCourse = Course & {
  isPublished: boolean;
  isOnSale: boolean;
  description: string;
  discountPrice: number;
};

type CourseDbRow = {
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
  description: string | null;
  discount_price: number | null;
  recommended_for: string | null;
  outcomes: string | null;
  is_published: number;
  is_on_sale: number;
};

function defaultStaticCourse(row: CourseDbRow): Course {
  // 관리자가 새로 등록한 강의(정적 카탈로그에 없는 슬러그)는
  // 풍부한 필드(curriculum, learnings 등)가 비어있는 기본값으로 만듭니다.
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    group: row.group_key as Course["group"],
    summary: row.summary,
    target: "",
    level: row.level as Course["level"],
    duration: row.duration,
    minutes: row.minutes,
    price: row.price,
    priceNumber: row.price_number,
    tags: [],
    thumbnail: row.thumbnail,
    materialPdf: row.material_pdf,
    badge: row.badge,
    cardCategory: row.card_category,
    originalPrice: row.original_price,
    rating: row.rating,
    reviewCount: row.review_count,
    intro: row.description ?? row.summary,
    recommendedFor: [],
    learnings: [],
    curriculum: [],
    formats: [],
    outcomes: [],
    caution: "",
    relatedSlugs: [],
  };
}

function splitLines(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeOverrides(staticBase: Course | null, row: CourseDbRow): PublicCourse {
  const base = staticBase ?? defaultStaticCourse(row);
  const recommendedFromDb = splitLines(row.recommended_for);
  const outcomesFromDb = splitLines(row.outcomes);
  return {
    ...base,
    title: row.title,
    category: row.category,
    group: row.group_key as Course["group"],
    summary: row.summary,
    level: row.level as Course["level"],
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
    // DB에 admin-edited 값이 있으면 사용, 없으면 정적 값 유지
    recommendedFor: recommendedFromDb.length > 0 ? recommendedFromDb : base.recommendedFor,
    outcomes: outcomesFromDb.length > 0 ? outcomesFromDb : base.outcomes,
    isPublished: row.is_published === 1,
    isOnSale: row.is_on_sale === 1,
    description: row.description ?? "",
    discountPrice: row.discount_price ?? 0,
  };
}

// 단일 강의를 조회합니다. is_published=0 인 강의는 기본적으로 null을 반환합니다.
// 관리자가 미리보기로 보고 싶으면 includeUnpublished: true 를 전달하세요.
export function getPublicCourse(
  slug: string,
  options?: { includeUnpublished?: boolean },
): PublicCourse | null {
  syncCoursesToDatabase();
  const row = getDatabase()
    .prepare(`SELECT * FROM courses WHERE slug = ?`)
    .get(slug) as CourseDbRow | undefined;
  if (!row) return null;
  if (row.is_published !== 1 && !options?.includeUnpublished) return null;
  return mergeOverrides(getStaticCourse(slug) ?? null, row);
}

// 공개 사이트에 노출되는 강의 목록 (is_published=1만).
export function listPublicCourses(): PublicCourse[] {
  syncCoursesToDatabase();
  const rows = getDatabase()
    .prepare(`SELECT * FROM courses WHERE is_published = 1 ORDER BY group_key, slug`)
    .all() as CourseDbRow[];
  return rows.map((row) => mergeOverrides(getStaticCourse(row.slug) ?? null, row));
}

// relatedSlugs를 받아서 공개된 강의만 반환합니다.
export function getRelatedPublicCourses(slugs: string[]): PublicCourse[] {
  return slugs
    .map((s) => getPublicCourse(s))
    .filter((c): c is PublicCourse => c !== null);
}
