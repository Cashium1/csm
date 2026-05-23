import Link from "next/link";
import {
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
  listAdminInquiries,
} from "@/lib/admin-extra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminInquiriesPage() {
  const inquiries = listAdminInquiries();
  const pending = inquiries.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">문의 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          전체 {inquiries.length}건 · 답변 대기 {pending}건
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">제목</th>
                <th className="px-5 py-3 text-left">문의자</th>
                <th className="px-5 py-3 text-left">유형</th>
                <th className="px-5 py-3 text-left">관련 강의/주문</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-left">작성일</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    등록된 문의가 없습니다.
                  </td>
                </tr>
              ) : (
                inquiries.map((i) => (
                  <tr key={i.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/inquiries/${i.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {i.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">ID: {i.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-zinc-900">{i.userName}</p>
                      <p className="text-xs text-zinc-500">{i.userEmail}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">
                      {INQUIRY_TYPE_LABEL[i.type] ?? i.type}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {i.relatedCourseTitle ? <p>📘 {i.relatedCourseTitle}</p> : null}
                      {i.relatedOrderId ? (
                        <p className="text-zinc-500">🧾 {i.relatedOrderId.slice(0, 14)}…</p>
                      ) : null}
                      {!i.relatedCourseTitle && !i.relatedOrderId ? "-" : null}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          i.status === "answered"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {INQUIRY_STATUS_LABEL[i.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateFormatter.format(new Date(i.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/inquiries/${i.id}`}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                      >
                        상세보기
                      </Link>
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
