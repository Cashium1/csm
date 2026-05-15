import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getCartCoursesForUser,
  getCompletedCoursesForUser,
  getInProgressCoursesForUser,
  getPaymentHistoryForUser,
  type CartCourseItem,
  type CourseListItem,
  type PaymentHistoryItem,
} from "@/lib/course-library";
import { getCurrentUser } from "@/lib/auth";
import { CartCourseActions, LearningCourseActions } from "./course-list-actions";
import { LogoutButton } from "./logout-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const cartCourses = getCartCoursesForUser(user.id);
  const inProgressCourses = getInProgressCoursesForUser(user.id);
  const completedCourses = getCompletedCoursesForUser(user.id);
  const paymentHistory = getPaymentHistoryForUser(user.id);
  const joinedAt = dateFormatter.format(new Date(user.createdAt));

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#b77900]">MY PAGE</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">마이페이지</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              담은 강의, 수강 중인 강의, 결제 내역과 회원 정보를 한곳에서 확인할 수 있습니다.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
            <nav aria-label="마이페이지 섹션 이동" className="space-y-1 text-sm font-extrabold">
              <SidebarLink href="#course-library" label="강의 목록" />
              <SidebarLink href="#cart-courses" label="담은 강의" count={cartCourses.length} />
              <SidebarLink href="#learning-courses" label="수강중인 강의" count={inProgressCourses.length} />
              <SidebarLink href="#completed-courses" label="완료된 강의" count={completedCourses.length} />
              <SidebarLink href="#payment-history" label="결제 내역" count={paymentHistory.length} />
              <SidebarLink href="#profile" label="회원 정보" />
            </nav>
          </aside>

          <main className="space-y-8">
            <div className="grid gap-4 md:grid-cols-4">
              <Metric label="담은 강의" value={`${cartCourses.length}개`} />
              <Metric label="수강중인 강의" value={`${inProgressCourses.length}개`} />
              <Metric label="완료된 강의" value={`${completedCourses.length}개`} />
              <Metric label="결제 내역" value={`${paymentHistory.length}건`} />
            </div>

            <section id="course-library" className="scroll-mt-28 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#b77900]">COURSES</p>
                  <h2 className="mt-2 text-2xl font-black text-zinc-950">강의 목록</h2>
                </div>
                <Link
                  href="/courses"
                  className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
                >
                  전체 강의 보기
                </Link>
              </div>

              <CourseSubsection
                id="cart-courses"
                title="담은 강의"
                description="아직 결제하거나 수강 신청하지 않은 관심 강의입니다."
                emptyText="담은 강의가 없습니다."
              >
                {cartCourses.map((course) => (
                  <CourseRow
                    key={course.slug}
                    course={course}
                    meta={`${dateFormatter.format(new Date(course.cartedAt))} 담음`}
                    actions={<CartCourseActions courseSlug={course.slug} isFree={course.priceNumber === 0} />}
                  />
                ))}
              </CourseSubsection>

              <CourseSubsection
                id="learning-courses"
                title="수강중인 강의"
                description="결제가 완료되었거나 무료 수강 신청이 끝난 강의입니다."
                emptyText="수강중인 강의가 없습니다."
              >
                {inProgressCourses.map((course) => (
                  <CourseRow
                    key={`${course.slug}-${course.stateAt}`}
                    course={course}
                    meta={`${dateFormatter.format(new Date(course.stateAt))} 시작`}
                    actions={<LearningCourseActions courseSlug={course.slug} />}
                  />
                ))}
              </CourseSubsection>

              <CourseSubsection
                id="completed-courses"
                title="완료된 강의"
                description="수강 완료로 표시한 강의입니다."
                emptyText="완료된 강의가 없습니다."
              >
                {completedCourses.map((course) => (
                  <CourseRow
                    key={`${course.slug}-${course.stateAt}`}
                    course={course}
                    meta={`${dateFormatter.format(new Date(course.stateAt))} 완료`}
                    actions={
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-zinc-800"
                      >
                        다시 보기
                      </Link>
                    }
                  />
                ))}
              </CourseSubsection>
            </section>

            <section id="payment-history" className="scroll-mt-28 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="border-b border-zinc-100 pb-5">
                <p className="text-sm font-extrabold text-[#b77900]">PAYMENTS</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">결제 내역</h2>
              </div>
              <div className="mt-2 divide-y divide-zinc-100">
                {paymentHistory.length ? (
                  paymentHistory.map((payment) => <PaymentRow key={`${payment.slug}-${payment.purchasedAt}`} payment={payment} />)
                ) : (
                  <EmptyState text="결제 내역이 없습니다." />
                )}
              </div>
            </section>

            <section id="profile" className="scroll-mt-28 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="border-b border-zinc-100 pb-5">
                <p className="text-sm font-extrabold text-[#b77900]">PROFILE</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950">회원 정보</h2>
              </div>
              <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
                <ProfileField label="이름" value={user.name} />
                <ProfileField label="이메일" value={user.email} />
                <ProfileField label="가입일" value={joinedAt} />
              </dl>
            </section>
          </main>
        </div>
      </div>
    </section>
  );
}

function SidebarLink({ href, label, count }: { href: string; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
    >
      <span>{label}</span>
      {typeof count === "number" ? <span className="text-xs font-black text-[#b77900]">{count}</span> : null}
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
    </div>
  );
}

function CourseSubsection({
  id,
  title,
  description,
  emptyText,
  children,
}: {
  id: string;
  title: string;
  description: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items;

  return (
    <section id={id} className="scroll-mt-28 border-b border-zinc-100 py-6 last:border-b-0 last:pb-0">
      <div className="mb-4">
        <h3 className="text-xl font-black text-zinc-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      <div className="divide-y divide-zinc-100">
        {isEmpty ? <EmptyState text={emptyText} /> : items}
      </div>
    </section>
  );
}

function CourseRow({
  course,
  meta,
  actions,
}: {
  course: CartCourseItem | CourseListItem;
  meta: string;
  actions: React.ReactNode;
}) {
  return (
    <article className="grid gap-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-[#f2c230] px-2.5 py-1 text-xs font-bold text-[#8a5a00]">
            {course.cardCategory}
          </span>
          <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">{course.level}</span>
          <span className="text-xs font-bold text-zinc-400">{meta}</span>
        </div>
        <Link href={`/courses/${course.slug}`} className="mt-3 block text-lg font-black text-zinc-950 hover:text-[#8a5a00]">
          {course.title}
        </Link>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{course.summary}</p>
      </div>
      <div className="md:justify-self-end">{actions}</div>
    </article>
  );
}

function PaymentRow({ payment }: { payment: PaymentHistoryItem }) {
  return (
    <article className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="font-black text-zinc-950">{payment.title}</p>
        <p className="mt-1 text-sm font-bold text-zinc-500">{dateFormatter.format(new Date(payment.purchasedAt))}</p>
      </div>
      <div className="text-left md:text-right">
        <p className="text-lg font-black text-zinc-950">{payment.price}</p>
        <Link href={`/courses/${payment.slug}`} className="text-sm font-extrabold text-[#8a5a00] hover:text-zinc-950">
          강의 보기
        </Link>
      </div>
    </article>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-4">
      <dt className="text-sm font-bold text-zinc-500">{label}</dt>
      <dd className="mt-2 break-words text-sm font-extrabold text-zinc-900">{value}</dd>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-bold text-zinc-500">{text}</p>
    </div>
  );
}
