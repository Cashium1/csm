import Link from "next/link";
import { listAdminCoupons } from "@/lib/coupons";
import { requirePermissionPage } from "@/lib/auth";
import { CouponRowActions } from "./coupon-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatDate(iso: string | null) {
  return iso ? dateFormatter.format(new Date(iso)) : "-";
}

function statusBadge(status: string) {
  if (status === "active") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
        활성
      </span>
    );
  }
  if (status === "expired") {
    return (
      <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
        만료
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">
      비활성
    </span>
  );
}

export default async function AdminCouponsPage() {
  await requirePermissionPage("manage:coupons");
  const coupons = listAdminCoupons();
  const active = coupons.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">쿠폰 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {coupons.length}개 · 활성 {active}개
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 쿠폰 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">쿠폰명</th>
                <th className="px-5 py-3 text-left">코드</th>
                <th className="px-5 py-3 text-left">할인</th>
                <th className="px-5 py-3 text-right">사용/한도</th>
                <th className="px-5 py-3 text-left">기간</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    등록된 쿠폰이 없습니다.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-700">{c.code}</td>
                    <td className="px-5 py-3.5 text-zinc-700">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}%`
                        : `${c.discountValue.toLocaleString("ko-KR")}원`}
                      {c.appliesToAllCourses ? (
                        <span className="ml-2 text-xs text-zinc-500">전체</span>
                      ) : (
                        <span className="ml-2 text-xs text-zinc-500">
                          {c.applicableCourseIds.length}개 강의
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {c.usedCount} / {c.usageLimit ?? "∞"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {formatDate(c.startsAt)} ~ {formatDate(c.endsAt)}
                    </td>
                    <td className="px-5 py-3.5 text-center">{statusBadge(c.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/coupons/${c.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        <CouponRowActions id={c.id} status={c.status} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
