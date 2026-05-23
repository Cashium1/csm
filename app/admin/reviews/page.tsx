import Link from "next/link";
import { listAdminReviews } from "@/lib/admin-extra";
import { ReviewToggle } from "./review-toggle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function truncate(text: string, max = 50) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function AdminReviewsPage() {
  const reviews = listAdminReviews();
  const hidden = reviews.filter((r) => r.status === "hidden").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">리뷰 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          전체 {reviews.length}건 · 숨김 {hidden}건
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">강의</th>
                <th className="px-5 py-3 text-left">작성자</th>
                <th className="px-5 py-3 text-center">별점</th>
                <th className="px-5 py-3 text-left">내용</th>
                <th className="px-5 py-3 text-center">노출 상태</th>
                <th className="px-5 py-3 text-left">작성일</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    등록된 리뷰가 없습니다.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5 font-extrabold text-zinc-900">
                      <Link
                        href={`/admin/courses/${r.courseSlug}`}
                        className="hover:underline"
                      >
                        {r.courseTitle}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-zinc-900">{r.userName}</p>
                      <p className="text-xs text-zinc-500">{r.userEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-amber-600">
                      {"★".repeat(r.rating)}
                      <span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">{truncate(r.content)}</td>
                    <td className="px-5 py-3.5 text-center">
                      {r.status === "hidden" ? (
                        <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-700">
                          숨김
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                          노출
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateFormatter.format(new Date(r.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/reviews/${r.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          상세보기
                        </Link>
                        <ReviewToggle id={r.id} status={r.status} />
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
