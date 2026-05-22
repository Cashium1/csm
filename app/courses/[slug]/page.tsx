import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course-card";
import { getCurrentUser } from "@/lib/auth";
import { hasCartedCourse } from "@/lib/course-library";
import { getCourseReviews, getUserCourseReview } from "@/lib/course-reviews";
import { courses, getCourse, getRelatedCourses } from "@/lib/data";
import { hasCourseAccess } from "@/lib/purchases";
import { CourseActionButton } from "./course-action-button";
import { CourseCartButton } from "./course-cart-button";
import { ReviewForm } from "./review-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const reviewDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return {
      title: "강의를 찾을 수 없습니다 | 캐쉬움",
    };
  }

  return {
    title: `${course.title} | 캐쉬움`,
    description: course.summary,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    notFound();
  }

  const relatedCourses = getRelatedCourses(course.relatedSlugs);
  const user = await getCurrentUser();
  const hasAccess = user ? hasCourseAccess(user.id, slug) : false;
  const isCarted = user ? hasCartedCourse(user.id, slug) : false;
  const isFree = course.priceNumber === 0;
  const reviews = getCourseReviews(slug);
  const userReview = user ? getUserCourseReview(slug, user.id) : null;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : null;

  return (
    <article className="bg-zinc-50">
      <section className="relative overflow-hidden bg-zinc-950">
        <Image
          src={course.heroImage ?? course.thumbnail}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-75"
          preload
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.88)_42%,rgba(255,255,255,0.40)_68%,rgba(24,24,27,0.20)_100%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              {course.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-[#fff4c4] px-3 py-1 text-xs font-extrabold text-[#8a5a00]">
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              {course.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-700 sm:text-lg">{course.intro}</p>
          </div>

          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)]">
            <p className="text-sm font-bold text-zinc-500">가격</p>
            <p className="mt-2 text-3xl font-black text-zinc-950">{course.price}</p>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <dt className="font-bold text-zinc-500">난이도</dt>
                <dd className="font-extrabold text-zinc-900">{course.level}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <dt className="font-bold text-zinc-500">학습 시간</dt>
                <dd className="font-extrabold text-zinc-900">{course.duration}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3">
                <dt className="font-bold text-zinc-500">자료 형식</dt>
                <dd className="font-extrabold text-zinc-900">PDF 중심</dd>
              </div>
            </dl>
            <CourseActionButton
              courseSlug={course.slug}
              courseTitle={course.title}
              isFree={isFree}
              hasAccess={hasAccess}
            />
            {!hasAccess ? <CourseCartButton courseSlug={course.slug} initialIsCarted={isCarted} /> : null}
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {isFree
                ? "무료 강의는 수강 신청 후 마이페이지에서 바로 이어볼 수 있습니다."
                : "결제 전에는 강의 구성과 주의사항을 먼저 확인해 주세요."}
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:px-8">
        <div className="space-y-4">
          <InfoPanel title="이런 분께 추천">
            <ul className="space-y-3 text-sm leading-6 text-zinc-700">
              {course.recommendedFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </InfoPanel>
          <InfoPanel title="자료 형식 안내">
            <div className="flex flex-wrap gap-2">
              {course.formats.map((format) => (
                <span key={format} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                  {format}
                </span>
              ))}
            </div>
          </InfoPanel>
        </div>

        <div className="space-y-4">
          <InfoPanel title="무엇을 배우나요">
            <div className="grid gap-3 sm:grid-cols-2">
              {course.learnings.map((item) => (
                <div key={item} className="rounded-lg bg-zinc-50 p-4 text-sm font-semibold leading-6 text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </InfoPanel>

          <InfoPanel title="목차 미리보기">
            <ol className="grid gap-3">
              {course.curriculum.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ffd84d] text-sm font-black text-zinc-950">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold text-zinc-800">{item}</span>
                </li>
              ))}
            </ol>
          </InfoPanel>

          <div className="grid gap-4 md:grid-cols-2">
            <InfoPanel title="기대할 수 있는 점">
              <ul className="space-y-3 text-sm leading-6 text-zinc-700">
                {course.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </InfoPanel>
            <InfoPanel title="현실적인 안내">
              <p className="text-sm leading-6 text-zinc-700">{course.caution}</p>
            </InfoPanel>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#b77900]">REVIEWS</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">수강 후기</h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm">
              <span className="font-black text-[#f2b705]" aria-hidden="true">
                ★
              </span>
              <span className="font-extrabold text-zinc-900">
                {averageRating ? averageRating.toFixed(1) : course.rating.toFixed(1)}
              </span>
              <span className="font-bold text-zinc-500">후기 {reviews.length}개</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4">
              {hasAccess ? (
                <ReviewForm courseSlug={course.slug} initialReview={userReview} />
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-5">
                  <h3 className="text-lg font-black text-zinc-950">후기 작성 권한</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    후기는 해당 강의를 수강 중인 사용자만 작성할 수 있습니다.
                    {user ? " 수강 신청 후 이 영역에서 후기를 남길 수 있어요." : " 로그인 후 수강 상태를 확인해 주세요."}
                  </p>
                  {isFree ? (
                    <CourseActionButton
                      courseSlug={course.slug}
                      courseTitle={course.title}
                      isFree={isFree}
                      hasAccess={false}
                    />
                  ) : (
                    <Link
                      href={user ? `/checkout?course=${course.slug}` : "/login"}
                      className="mt-4 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
                    >
                      {user ? "강의 결제하기" : "로그인하기"}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {reviews.length ? (
                reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-black text-zinc-950">{review.userName}</p>
                        <p className="mt-1 text-xs font-bold text-zinc-400">
                          {reviewDateFormatter.format(new Date(review.updatedAt))}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-black text-[#f2b705]" aria-label={`${review.rating}점`}>
                        {"★".repeat(review.rating)}
                        <span className="text-zinc-300">{"★".repeat(5 - review.rating)}</span>
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{review.content}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
                  <p className="text-base font-black text-zinc-950">아직 등록된 후기가 없습니다</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">첫 수강 후기를 남겨 강의를 고민하는 분들에게 도움을 주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {relatedCourses.length ? (
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <p className="text-sm font-extrabold text-[#b77900]">RELATED</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">함께 보면 좋은 강의</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {relatedCourses.map((related) => (
                <CourseCard key={related.slug} course={related} compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
