"use client";

import Link from "next/link";
import { useState } from "react";
import { CourseCard } from "@/components/course-card";
import type {
  CartCourseItem,
  CourseListItem,
  PaymentHistoryItem,
} from "@/lib/course-library";
import { CartCourseActions, LearningCourseActions } from "./course-list-actions";
import { ProfileSection } from "./profile-section";

type TabKey = "library" | "payments" | "profile";

type MyPageContentProps = {
  user: { name: string; email: string; createdAt: string };
  cartCourses: CartCourseItem[];
  inProgressCourses: CourseListItem[];
  completedCourses: CourseListItem[];
  paymentHistory: PaymentHistoryItem[];
};

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const tabs: { key: TabKey; label: string }[] = [
  { key: "library", label: "강의 목록" },
  { key: "payments", label: "결제 내역" },
  { key: "profile", label: "회원 정보" },
];

export function MyPageContent({
  user,
  cartCourses,
  inProgressCourses,
  completedCourses,
  paymentHistory,
}: MyPageContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("library");

  const tabCounts: Record<TabKey, number | undefined> = {
    library: cartCourses.length + inProgressCourses.length + completedCourses.length,
    payments: paymentHistory.length,
    profile: undefined,
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[230px_1fr]">
      <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
        <nav aria-label="마이페이지 섹션" className="space-y-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              label={tab.label}
              count={tabCounts[tab.key]}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </nav>
      </aside>

      <main>
        {activeTab === "library" ? (
          <LibrarySection
            cartCourses={cartCourses}
            inProgressCourses={inProgressCourses}
            completedCourses={completedCourses}
          />
        ) : null}
        {activeTab === "payments" ? <PaymentsSection paymentHistory={paymentHistory} /> : null}
        {activeTab === "profile" ? <ProfileSection user={user} /> : null}
      </main>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-extrabold transition ${
        active ? "bg-zinc-950 text-white" : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
      }`}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className={`text-xs font-black ${active ? "text-[#ffd84d]" : "text-[#b77900]"}`}>{count}</span>
      ) : null}
    </button>
  );
}

function LibrarySection({
  cartCourses,
  inProgressCourses,
  completedCourses,
}: {
  cartCourses: CartCourseItem[];
  inProgressCourses: CourseListItem[];
  completedCourses: CourseListItem[];
}) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="담은 강의" value={`${cartCourses.length}개`} />
        <Metric label="수강중인 강의" value={`${inProgressCourses.length}개`} />
        <Metric label="완료된 강의" value={`${completedCourses.length}개`} />
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
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

        <div className="mt-5 space-y-5">
          <CourseSubsection
            tone="cart"
            count={cartCourses.length}
            title="담은 강의"
            description="아직 결제하거나 수강 신청하지 않은 관심 강의입니다."
            emptyText="담은 강의가 없습니다."
          >
            {cartCourses.map((course) => (
              <CourseCard
                key={course.slug}
                course={course}
                footer={
                  <CourseCardFooter meta={`${dateFormatter.format(new Date(course.cartedAt))} 담음`}>
                    <CartCourseActions courseSlug={course.slug} isFree={course.priceNumber === 0} />
                  </CourseCardFooter>
                }
              />
            ))}
          </CourseSubsection>

          <CourseSubsection
            tone="learning"
            count={inProgressCourses.length}
            title="수강중인 강의"
            description="결제가 완료되었거나 무료 수강 신청이 끝난 강의입니다."
            emptyText="수강중인 강의가 없습니다."
          >
            {inProgressCourses.map((course) => (
              <CourseCard
                key={`${course.slug}-${course.stateAt}`}
                course={course}
                footer={
                  <CourseCardFooter meta={`${dateFormatter.format(new Date(course.stateAt))} 시작`}>
                    <LearningCourseActions courseSlug={course.slug} />
                  </CourseCardFooter>
                }
              />
            ))}
          </CourseSubsection>

          <CourseSubsection
            tone="completed"
            count={completedCourses.length}
            title="완료된 강의"
            description="수강 완료로 표시한 강의입니다."
            emptyText="완료된 강의가 없습니다."
          >
            {completedCourses.map((course) => (
              <CourseCard
                key={`${course.slug}-${course.stateAt}`}
                course={course}
                footer={
                  <CourseCardFooter meta={`${dateFormatter.format(new Date(course.stateAt))} 완료`}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-zinc-800"
                    >
                      다시 보기
                    </Link>
                  </CourseCardFooter>
                }
              />
            ))}
          </CourseSubsection>
        </div>
      </section>
    </div>
  );
}

function PaymentsSection({ paymentHistory }: { paymentHistory: PaymentHistoryItem[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#b77900]">PAYMENTS</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">결제 내역</h2>
        </div>
        <Link
          href="/mypage/payments"
          className="inline-flex rounded-full border border-zinc-300 px-4 py-2 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
        >
          전체 결제 내역
        </Link>
      </div>
      <div className="mt-2 divide-y divide-zinc-100">
        {paymentHistory.length ? (
          paymentHistory.map((payment) => <PaymentRow key={payment.id} payment={payment} />)
        ) : (
          <EmptyState text="결제 내역이 없습니다." />
        )}
      </div>
    </section>
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

type SubsectionTone = "cart" | "learning" | "completed";

const subsectionTones: Record<
  SubsectionTone,
  { card: string; header: string; dot: string; badge: string; emptyBadge: string }
> = {
  cart: {
    card: "border-[#d6e4ff]",
    header: "bg-[#f4f8ff]",
    dot: "bg-[#3b82f6]",
    badge: "bg-[#3b82f6] text-white",
    emptyBadge: "bg-zinc-200 text-zinc-500",
  },
  learning: {
    card: "border-[#f3e0a0]",
    header: "bg-[#fffae6]",
    dot: "bg-[#f2b705]",
    badge: "bg-[#f2b705] text-zinc-950",
    emptyBadge: "bg-zinc-200 text-zinc-500",
  },
  completed: {
    card: "border-[#bce8d6]",
    header: "bg-[#eefaf4]",
    dot: "bg-[#10b981]",
    badge: "bg-[#10b981] text-white",
    emptyBadge: "bg-zinc-200 text-zinc-500",
  },
};

function CourseSubsection({
  title,
  description,
  emptyText,
  tone,
  count,
  children,
}: {
  title: string;
  description: string;
  emptyText: string;
  tone: SubsectionTone;
  count: number;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const isEmpty = Array.isArray(items) ? items.length === 0 : !items;
  const styles = subsectionTones[tone];

  return (
    <section className={`overflow-hidden rounded-xl border ${styles.card}`}>
      <div className={`px-5 py-4 ${styles.header}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} aria-hidden />
          <h3 className="text-lg font-black text-zinc-950">{title}</h3>
          <span
            className={`ml-1 inline-flex min-w-6 justify-center rounded-full px-2 py-0.5 text-xs font-black ${
              count > 0 ? styles.badge : styles.emptyBadge
            }`}
          >
            {count}
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="bg-white p-5">
        {isEmpty ? (
          <EmptyState text={emptyText} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items}</div>
        )}
      </div>
    </section>
  );
}

function CourseCardFooter({ meta, children }: { meta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-zinc-400">{meta}</p>
      {children}
    </div>
  );
}

function PaymentRow({ payment }: { payment: PaymentHistoryItem }) {
  return (
    <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black text-zinc-950">{payment.title}</p>
        <p className="mt-1 text-sm font-bold text-zinc-500">
          {dateFormatter.format(new Date(payment.purchasedAt))}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-lg font-black text-zinc-950">{payment.price}</p>
        <Link
          href={`/mypage/payments/${payment.id}`}
          className="inline-flex shrink-0 rounded-full bg-zinc-950 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          상세보기
        </Link>
      </div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm font-bold text-zinc-500">{text}</p>
    </div>
  );
}
