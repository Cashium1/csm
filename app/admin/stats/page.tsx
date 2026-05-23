import Link from "next/link";
import { ORDER_STATUS_LABELS } from "@/lib/admin";
import { requirePermissionPage } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CountRow = { c: number };
type TotalRow = { total: number };

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

function rangeLabel(range: string) {
  if (range === "today") return "오늘";
  if (range === "7d") return "최근 7일";
  if (range === "30d") return "최근 30일";
  if (range === "month") return "이번 달";
  if (range === "last_month") return "지난 달";
  return "전체";
}

function computeRange(range: string): { from: string | null; to: string | null } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (range === "today") return { from: today, to: today };
  if (range === "7d") {
    const past = new Date(now);
    past.setDate(now.getDate() - 7);
    return { from: past.toISOString().slice(0, 10), to: today };
  }
  if (range === "30d") {
    const past = new Date(now);
    past.setDate(now.getDate() - 30);
    return { from: past.toISOString().slice(0, 10), to: today };
  }
  if (range === "month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const from = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    return { from, to: today };
  }
  if (range === "last_month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const from = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
    const to = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    return { from, to };
  }
  return { from: null, to: null };
}

const RANGES = ["today", "7d", "30d", "month", "last_month", "all"] as const;

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requirePermissionPage("view:stats");
  const params = await searchParams;
  const range = (RANGES as readonly string[]).includes(params.range ?? "")
    ? (params.range as string)
    : "30d";
  const { from, to } = computeRange(range);

  const db = getDatabase();

  const where: string[] = [];
  const args: string[] = [];
  if (from) {
    where.push(`substr(COALESCE(approved_at, created_at), 1, 10) >= ?`);
    args.push(from);
  }
  if (to) {
    where.push(`substr(COALESCE(approved_at, created_at), 1, 10) <= ?`);
    args.push(to);
  }
  const dateFilter = where.length > 0 ? `AND ${where.join(" AND ")}` : "";

  const totalRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM orders WHERE status = 'paid' ${dateFilter}`,
      )
      .get(...args) as TotalRow
  ).total;
  const refundTotal = (
    db
      .prepare(
        `SELECT COALESCE(SUM(COALESCE(refund_amount, amount)), 0) AS total
         FROM orders WHERE status = 'refunded' ${dateFilter.replaceAll("approved_at", "refunded_at")}`,
      )
      .get(...args) as TotalRow
  ).total;
  const paidCount = (
    db
      .prepare(`SELECT count(*) AS c FROM orders WHERE status = 'paid' ${dateFilter}`)
      .get(...args) as CountRow
  ).c;
  const refundCount = (
    db
      .prepare(
        `SELECT count(*) AS c FROM orders WHERE status = 'refunded' ${dateFilter.replaceAll("approved_at", "refunded_at")}`,
      )
      .get(...args) as CountRow
  ).c;
  const avgPayment = paidCount > 0 ? Math.round(totalRevenue / paidCount) : 0;
  const netRevenue = totalRevenue - refundTotal;

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const monthRevenue = (
    db
      .prepare(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM orders
         WHERE status = 'paid' AND substr(COALESCE(approved_at, created_at), 1, 7) = ?`,
      )
      .get(monthPrefix) as TotalRow
  ).total;
  const monthRefund = (
    db
      .prepare(
        `SELECT COALESCE(SUM(COALESCE(refund_amount, amount)), 0) AS total FROM orders
         WHERE status = 'refunded' AND substr(COALESCE(refunded_at, updated_at), 1, 7) = ?`,
      )
      .get(monthPrefix) as TotalRow
  ).total;

  const summaryCards = [
    { label: "총 매출", value: formatWon(totalRevenue) },
    { label: "총 환불 금액", value: formatWon(refundTotal) },
    { label: "실매출 (총 매출 - 환불)", value: formatWon(netRevenue) },
    { label: "총 결제 건수", value: `${paidCount.toLocaleString("ko-KR")}건` },
    { label: "총 환불 건수", value: `${refundCount.toLocaleString("ko-KR")}건` },
    { label: "평균 결제 금액", value: formatWon(avgPayment) },
    { label: "이번 달 매출", value: formatWon(monthRevenue) },
    { label: "이번 달 실매출", value: formatWon(monthRevenue - monthRefund) },
  ];

  // 일별 매출 (최근 30일)
  const daily = db
    .prepare(
      `SELECT substr(COALESCE(approved_at, created_at), 1, 10) AS day,
              count(*) AS count, COALESCE(SUM(amount), 0) AS revenue
       FROM orders
       WHERE status = 'paid' ${dateFilter}
       GROUP BY day ORDER BY day DESC LIMIT 30`,
    )
    .all(...args) as Array<{ day: string; count: number; revenue: number }>;

  // 월별 매출 (최근 12개월)
  const monthly = db
    .prepare(
      `SELECT substr(COALESCE(approved_at, created_at), 1, 7) AS month,
              count(*) AS count, COALESCE(SUM(amount), 0) AS revenue
       FROM orders
       WHERE status = 'paid'
       GROUP BY month ORDER BY month DESC LIMIT 12`,
    )
    .all() as Array<{ month: string; count: number; revenue: number }>;

  // 강의별 TOP 10
  const topCourses = db
    .prepare(
      `SELECT o.course_slug AS slug,
              COALESCE(c.title, o.course_slug) AS title,
              count(*) AS sales,
              COALESCE(SUM(o.amount), 0) AS revenue
       FROM orders o
       LEFT JOIN courses c ON c.slug = o.course_slug
       WHERE o.status = 'paid' ${dateFilter.replaceAll("approved_at", "o.approved_at").replaceAll("created_at", "o.created_at")}
       GROUP BY o.course_slug
       ORDER BY revenue DESC LIMIT 10`,
    )
    .all(...args) as Array<{ slug: string; title: string; sales: number; revenue: number }>;

  // 카테고리별 매출
  const byCategory = db
    .prepare(
      `SELECT COALESCE(c.group_key, '-') AS category,
              count(*) AS sales,
              COALESCE(SUM(o.amount), 0) AS revenue
       FROM orders o
       LEFT JOIN courses c ON c.slug = o.course_slug
       WHERE o.status = 'paid' ${dateFilter.replaceAll("approved_at", "o.approved_at").replaceAll("created_at", "o.created_at")}
       GROUP BY c.group_key ORDER BY revenue DESC`,
    )
    .all(...args) as Array<{ category: string; sales: number; revenue: number }>;

  const recentPayments = db
    .prepare(
      `SELECT o.id, o.order_name, o.amount, o.status, o.created_at,
              u.name AS user_name
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.status = 'paid'
       ORDER BY o.created_at DESC LIMIT 10`,
    )
    .all() as Array<{
      id: string;
      order_name: string;
      amount: number;
      status: string;
      created_at: string;
      user_name: string;
    }>;

  const recentRefunds = db
    .prepare(
      `SELECT o.id, o.order_name, COALESCE(o.refund_amount, o.amount) AS amount,
              o.refunded_at, u.name AS user_name
       FROM orders o
       INNER JOIN "USER" u ON u.id = o.user_id
       WHERE o.status = 'refunded'
       ORDER BY o.refunded_at DESC LIMIT 10`,
    )
    .all() as Array<{
      id: string;
      order_name: string;
      amount: number;
      refunded_at: string | null;
      user_name: string;
    }>;

  const maxDailyRev = daily.reduce((m, r) => Math.max(m, r.revenue), 0);
  const maxMonthlyRev = monthly.reduce((m, r) => Math.max(m, r.revenue), 0);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">매출 통계</h1>
        <p className="mt-1 text-sm text-zinc-500">
          기간: <span className="font-bold text-zinc-700">{rangeLabel(range)}</span>
          {from || to ? (
            <span className="ml-2 text-zinc-500">
              ({from ?? "~"} ~ {to ?? "~"})
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { key: "today", label: "오늘" },
          { key: "7d", label: "최근 7일" },
          { key: "30d", label: "최근 30일" },
          { key: "month", label: "이번 달" },
          { key: "last_month", label: "지난 달" },
          { key: "all", label: "전체" },
        ].map((r) => (
          <Link
            key={r.key}
            href={`/admin/stats?range=${r.key}`}
            className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
              range === r.key
                ? "bg-zinc-950 text-white"
                : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold text-zinc-500">{card.label}</p>
            <p className="mt-2 text-xl font-black text-zinc-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="일별 매출 추이 (최근 30일)" empty="데이터가 없습니다.">
          {daily.length > 0 ? (
            <div className="grid grid-cols-15 items-end gap-1" style={{ minHeight: 120 }}>
              {[...daily].reverse().map((d) => {
                const ratio = maxDailyRev > 0 ? Math.max(4, (d.revenue / maxDailyRev) * 100) : 4;
                return (
                  <div
                    key={d.day}
                    title={`${d.day} · ${d.count}건 · ${formatWon(d.revenue)}`}
                    className="rounded-t bg-[#ffd84d]"
                    style={{ height: `${ratio}%` }}
                  />
                );
              })}
            </div>
          ) : null}
        </ChartCard>

        <ChartCard title="월별 매출 추이 (최근 12개월)" empty="데이터가 없습니다.">
          {monthly.length > 0 ? (
            <div className="grid grid-cols-12 items-end gap-2" style={{ minHeight: 120 }}>
              {[...monthly].reverse().map((m) => {
                const ratio = maxMonthlyRev > 0 ? Math.max(6, (m.revenue / maxMonthlyRev) * 100) : 6;
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1">
                    <div
                      title={`${m.month} · ${m.count}건 · ${formatWon(m.revenue)}`}
                      className="w-full rounded-t bg-emerald-400"
                      style={{ height: `${ratio}%` }}
                    />
                    <span className="text-[10px] font-bold text-zinc-500">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SimpleTable
          title="강의별 매출 TOP 10"
          empty="판매 데이터가 없습니다."
          rows={topCourses.length}
        >
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">강의</th>
              <th className="px-5 py-2.5 text-right">판매</th>
              <th className="px-5 py-2.5 text-right">매출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {topCourses.map((c) => (
              <tr key={c.slug}>
                <td className="px-5 py-2.5 font-extrabold text-zinc-900">{c.title}</td>
                <td className="px-5 py-2.5 text-right text-zinc-700">{c.sales}건</td>
                <td className="px-5 py-2.5 text-right font-bold text-zinc-900">
                  {formatWon(c.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </SimpleTable>

        <SimpleTable
          title="카테고리별 매출"
          empty="판매 데이터가 없습니다."
          rows={byCategory.length}
        >
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">대분류</th>
              <th className="px-5 py-2.5 text-right">판매</th>
              <th className="px-5 py-2.5 text-right">매출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {byCategory.map((c) => (
              <tr key={c.category}>
                <td className="px-5 py-2.5 font-extrabold text-zinc-900">{c.category}</td>
                <td className="px-5 py-2.5 text-right text-zinc-700">{c.sales}건</td>
                <td className="px-5 py-2.5 text-right font-bold text-zinc-900">
                  {formatWon(c.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </SimpleTable>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SimpleTable
          title="최근 결제 내역"
          empty="결제 내역이 없습니다."
          rows={recentPayments.length}
        >
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
                <td className="px-5 py-2.5 font-extrabold text-zinc-900">{p.order_name}</td>
                <td className="px-5 py-2.5 text-zinc-700">{p.user_name}</td>
                <td className="px-5 py-2.5 text-right font-bold text-zinc-900">
                  {formatWon(p.amount)}
                </td>
                <td className="px-5 py-2.5 text-zinc-700">
                  {ORDER_STATUS_LABELS[p.status] ?? p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </SimpleTable>

        <SimpleTable
          title="최근 환불 내역"
          empty="환불 내역이 없습니다."
          rows={recentRefunds.length}
        >
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">강의</th>
              <th className="px-5 py-2.5 text-left">회원</th>
              <th className="px-5 py-2.5 text-right">금액</th>
              <th className="px-5 py-2.5 text-left">처리일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {recentRefunds.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5 font-extrabold text-zinc-900">{r.order_name}</td>
                <td className="px-5 py-2.5 text-zinc-700">{r.user_name}</td>
                <td className="px-5 py-2.5 text-right font-bold text-zinc-900">
                  {formatWon(r.amount)}
                </td>
                <td className="px-5 py-2.5 text-zinc-600">
                  {r.refunded_at ? dateTimeFormatter.format(new Date(r.refunded_at)) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </SimpleTable>
      </section>
    </div>
  );
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-zinc-950">{title}</h3>
      <div className="mt-4">{children ?? <p className="text-center text-sm text-zinc-400">{empty}</p>}</div>
    </div>
  );
}

function SimpleTable({
  title,
  empty,
  rows,
  children,
}: {
  title: string;
  empty: string;
  rows: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-3">
        <h3 className="text-sm font-black text-zinc-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        {rows === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">{empty}</p>
        ) : (
          <table className="min-w-full text-sm">{children}</table>
        )}
      </div>
    </div>
  );
}
