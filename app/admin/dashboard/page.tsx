import Link from "next/link";
import { getDashboardData, ORDER_STATUS_LABELS } from "@/lib/admin";
import { getDashboardExtras, INQUIRY_STATUS_LABEL, INQUIRY_TYPE_LABEL } from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return dateTimeFormatter.format(new Date(iso));
}

export default async function AdminDashboardPage() {
  const { stats, recentMembers, recentPayments } = getDashboardData();
  const extras = getDashboardExtras();

  const overviewCards = [
    { label: "총 회원 수", value: `${stats.totalMembers.toLocaleString("ko-KR")}명` },
    { label: "총 강의 수", value: `${stats.totalCourses.toLocaleString("ko-KR")}개` },
    { label: "판매 중인 강의", value: `${stats.onSaleCourses.toLocaleString("ko-KR")}개` },
    { label: "총 결제 건수", value: `${stats.paidOrders.toLocaleString("ko-KR")}건` },
    { label: "총 매출", value: formatWon(stats.totalRevenue) },
    { label: "오늘 매출", value: formatWon(stats.todayRevenue) },
  ];

  const operationCards = [
    {
      label: "답변 대기 문의",
      value: `${extras.pendingInquiries.toLocaleString("ko-KR")}건`,
      href: "/admin/inquiries",
      tone: "amber",
    },
    {
      label: "환불 요청",
      value: `${extras.refundRequests.toLocaleString("ko-KR")}건`,
      href: "/admin/payments",
      tone: "red",
    },
    {
      label: "숨김 리뷰",
      value: `${extras.hiddenReviews.toLocaleString("ko-KR")}건`,
      href: "/admin/reviews",
      tone: "zinc",
    },
    { label: "이번 달 매출", value: formatWon(extras.monthRevenue) },
    { label: "이번 달 환불", value: formatWon(extras.monthRefund) },
    { label: "이번 달 실매출", value: formatWon(extras.monthNetRevenue) },
  ];

  const toneClass: Record<string, string> = {
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
    zinc: "border-zinc-200 bg-white",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">대시보드</h1>
        <p className="mt-1 text-sm text-zinc-500">서비스 운영 현황을 한눈에 확인합니다.</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-zinc-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black text-zinc-950">운영 지표</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {operationCards.map((card) => {
            const inner = (
              <>
                <p className="text-xs font-bold text-zinc-500">{card.label}</p>
                <p className="mt-2 text-2xl font-black text-zinc-950">{card.value}</p>
              </>
            );
            const cls = `block rounded-lg border p-5 shadow-sm transition ${
              toneClass[card.tone ?? "zinc"]
            } ${card.href ? "hover:border-zinc-400" : ""}`;
            return card.href ? (
              <Link key={card.label} href={card.href} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={card.label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="최근 가입 회원"
          href="/admin/members"
          empty="가입한 회원이 없습니다."
          rows={recentMembers.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">이름</th>
                <th className="px-5 py-2.5 text-left">이메일</th>
                <th className="px-5 py-2.5 text-left">가입일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentMembers.map((m) => (
                <tr key={m.id}>
                  <td className="px-5 py-3 font-extrabold text-zinc-900">
                    {m.name}
                    {m.role === "admin" ? (
                      <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                        ADMIN
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{m.email}</td>
                  <td className="px-5 py-3 text-zinc-600">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>

        <DashboardCard
          title="최근 결제 내역"
          href="/admin/payments"
          empty="결제 내역이 없습니다."
          rows={recentPayments.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">강의</th>
                <th className="px-5 py-2.5 text-left">회원</th>
                <th className="px-5 py-2.5 text-right">금액</th>
                <th className="px-5 py-2.5 text-left">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentPayments.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-extrabold text-zinc-900">{p.orderName}</td>
                  <td className="px-5 py-3 text-zinc-600">{p.userName}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-900">
                    {formatWon(p.amount)}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">
                    {ORDER_STATUS_LABELS[p.status] ?? p.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="최근 문의"
          href="/admin/inquiries"
          empty="등록된 문의가 없습니다."
          rows={extras.recentInquiries.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">제목</th>
                <th className="px-5 py-2.5 text-left">유형</th>
                <th className="px-5 py-2.5 text-left">상태</th>
                <th className="px-5 py-2.5 text-left">작성일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {extras.recentInquiries.map((i) => (
                <tr key={i.id}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/inquiries/${i.id}`}
                      className="font-extrabold text-zinc-900 hover:underline"
                    >
                      {i.title}
                    </Link>
                    <p className="text-xs text-zinc-500">{i.userName}</p>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{INQUIRY_TYPE_LABEL[i.type] ?? i.type}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                        i.status === "answered"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {INQUIRY_STATUS_LABEL[i.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatDateTime(i.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>

        <DashboardCard
          title="최근 환불 요청"
          href="/admin/payments"
          empty="환불 요청이 없습니다."
          rows={extras.recentRefundRequests.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">강의</th>
                <th className="px-5 py-2.5 text-left">회원</th>
                <th className="px-5 py-2.5 text-right">금액</th>
                <th className="px-5 py-2.5 text-left">요청일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {extras.recentRefundRequests.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/payments/${r.id}`}
                      className="font-extrabold text-zinc-900 hover:underline"
                    >
                      {r.orderName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{r.userName}</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-900">
                    {formatWon(r.amount)}
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{formatDateTime(r.refundRequestedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardCard
          title="최근 리뷰"
          href="/admin/reviews"
          empty="등록된 리뷰가 없습니다."
          rows={extras.recentReviews.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">강의</th>
                <th className="px-5 py-2.5 text-left">작성자</th>
                <th className="px-5 py-2.5 text-left">별점</th>
                <th className="px-5 py-2.5 text-left">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {extras.recentReviews.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/reviews/${r.id}`}
                      className="font-extrabold text-zinc-900 hover:underline"
                    >
                      {r.courseTitle}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-zinc-600">{r.userName}</td>
                  <td className="px-5 py-3 text-amber-600">{"★".repeat(r.rating)}</td>
                  <td className="px-5 py-3">
                    {r.status === "hidden" ? (
                      <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-black text-zinc-700">
                        숨김
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                        노출
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>

        <DashboardCard
          title="인기 강의 TOP 5"
          href="/admin/courses"
          empty="판매된 강의가 없습니다."
          rows={extras.topCourses.length}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-2.5 text-left">강의</th>
                <th className="px-5 py-2.5 text-right">판매</th>
                <th className="px-5 py-2.5 text-right">매출</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {extras.topCourses.map((c) => (
                <tr key={c.slug}>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/courses/${c.slug}`}
                      className="font-extrabold text-zinc-900 hover:underline"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-900">{c.salesCount}건</td>
                  <td className="px-5 py-3 text-right font-bold text-zinc-900">
                    {formatWon(c.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </section>
    </div>
  );
}

function DashboardCard({
  title,
  href,
  empty,
  rows,
  children,
}: {
  title: string;
  href: string;
  empty: string;
  rows: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-black text-zinc-950">{title}</h2>
        <Link href={href} className="text-xs font-extrabold text-zinc-600 hover:text-zinc-950">
          전체 보기 →
        </Link>
      </div>
      <div className="overflow-x-auto">
        {rows === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">{empty}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
