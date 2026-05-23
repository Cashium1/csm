import Link from "next/link";
import { listAdminNotices } from "@/lib/admin";
import { NoticeRowActions } from "./notice-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default async function AdminNoticesPage() {
  const notices = listAdminNotices();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">공지사항 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">전체 {notices.length}건</p>
        </div>
        <Link
          href="/admin/notices/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 공지 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">제목</th>
                <th className="px-5 py-3 text-center">상단고정</th>
                <th className="px-5 py-3 text-center">공개</th>
                <th className="px-5 py-3 text-left">작성일</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-400">
                    등록된 공지가 없습니다.
                  </td>
                </tr>
              ) : (
                notices.map((n) => (
                  <tr key={n.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/notices/${n.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {n.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {n.isPinned ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800">
                          PIN
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {n.isPublished ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                          공개
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500">
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateFormatter.format(new Date(n.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/notices/${n.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        <NoticeRowActions id={n.id} />
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
