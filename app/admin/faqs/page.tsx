import Link from "next/link";
import { listAdminFaqs } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { FaqRowActions } from "./faq-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requirePermissionPage("manage:faqs");
  const faqs = listAdminFaqs();
  const published = faqs.filter((f) => f.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">FAQ 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {faqs.length}건 · 공개 {published}건
          </p>
        </div>
        <Link
          href="/admin/faqs/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 FAQ 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">카테고리</th>
                <th className="px-5 py-3 text-left">질문</th>
                <th className="px-5 py-3 text-center">순서</th>
                <th className="px-5 py-3 text-center">공개</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-zinc-400">
                    등록된 FAQ가 없습니다.
                  </td>
                </tr>
              ) : (
                faqs.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5 text-zinc-700">{f.category}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/faqs/${f.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {f.question}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-zinc-900">
                      {f.displayOrder}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {f.isPublished ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                          공개
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
                          비공개
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/faqs/${f.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        <FaqRowActions id={f.id} />
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
