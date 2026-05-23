import { ORDER_STATUS_LABELS } from "@/lib/admin";
import { getCourseSalesStats } from "@/lib/admin-extra";

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

export function CourseSalesPanel({ slug }: { slug: string }) {
  const stats = getCourseSalesStats(slug);

  const cards = [
    { label: "총 판매 건수", value: `${stats.totalSales.toLocaleString("ko-KR")}건` },
    { label: "총 매출", value: formatWon(stats.totalRevenue) },
    { label: "환불 건수", value: `${stats.refundCount.toLocaleString("ko-KR")}건` },
    { label: "환불 금액", value: formatWon(stats.refundAmount) },
    { label: "실매출", value: formatWon(stats.netRevenue) },
    { label: "구매 회원 수", value: `${stats.uniqueBuyers.toLocaleString("ko-KR")}명` },
  ];

  const maxMonthRevenue = stats.monthly.reduce((m, r) => Math.max(m, r.revenue), 0);

  return (
    <section className="space-y-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-wider text-zinc-500">SALES STATS</p>
          <h2 className="mt-1 text-lg font-black text-zinc-950">판매 통계</h2>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-bold text-zinc-500">{c.label}</p>
            <p className="mt-1.5 text-xl font-black text-zinc-950">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-sm font-black text-zinc-950">월별 판매 추이 (최근 12개월)</h3>
        </div>
        {stats.monthly.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">데이터가 없습니다.</p>
        ) : (
          <div className="p-5">
            <div className="grid grid-cols-12 items-end gap-2" style={{ minHeight: 120 }}>
              {stats.monthly.map((m) => {
                const ratio =
                  maxMonthRevenue > 0 ? Math.max(6, (m.revenue / maxMonthRevenue) * 100) : 6;
                return (
                  <div key={m.month} className="flex flex-col items-center gap-1">
                    <div
                      title={`${m.month} · ${m.count}건 · ${formatWon(m.revenue)}`}
                      className="w-full rounded-t bg-[#ffd84d]"
                      style={{ height: `${ratio}%` }}
                    />
                    <span className="text-[10px] font-bold text-zinc-500">
                      {m.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">월</th>
                    <th className="px-3 py-2 text-right">판매 건수</th>
                    <th className="px-3 py-2 text-right">매출</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {stats.monthly.map((m) => (
                    <tr key={m.month}>
                      <td className="px-3 py-2 font-bold text-zinc-900">{m.month}</td>
                      <td className="px-3 py-2 text-right text-zinc-700">{m.count}건</td>
                      <td className="px-3 py-2 text-right font-bold text-zinc-900">
                        {formatWon(m.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-zinc-200">
        <div className="border-b border-zinc-100 px-5 py-3">
          <h3 className="text-sm font-black text-zinc-950">최근 구매 내역</h3>
        </div>
        {stats.recentPurchases.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">구매 내역이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-2.5 text-left">구매자</th>
                  <th className="px-5 py-2.5 text-left">이메일</th>
                  <th className="px-5 py-2.5 text-right">결제 금액</th>
                  <th className="px-5 py-2.5 text-center">결제 상태</th>
                  <th className="px-5 py-2.5 text-left">구매일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.recentPurchases.map((p, idx) => (
                  <tr key={`${p.userEmail}-${idx}`}>
                    <td className="px-5 py-3 font-extrabold text-zinc-900">{p.userName}</td>
                    <td className="px-5 py-3 text-zinc-600">{p.userEmail}</td>
                    <td className="px-5 py-3 text-right font-bold text-zinc-900">
                      {formatWon(p.amount)}
                    </td>
                    <td className="px-5 py-3 text-center text-zinc-700">
                      {ORDER_STATUS_LABELS[p.status] ?? p.status}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">
                      {dateTimeFormatter.format(new Date(p.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
