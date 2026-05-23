import Link from "next/link";
import { listAdminBanners } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { BannerRowActions } from "./banner-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requirePermissionPage("manage:banners");
  const banners = listAdminBanners();
  const published = banners.filter((b) => b.isPublished).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">배너 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {banners.length}건 · 공개 {published}건. 메인 페이지에는 공개 상태 배너가 노출 순서대로 표시됩니다.
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 배너 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">제목</th>
                <th className="px-5 py-3 text-left">위치</th>
                <th className="px-5 py-3 text-center">순서</th>
                <th className="px-5 py-3 text-left">버튼</th>
                <th className="px-5 py-3 text-center">공개</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                    등록된 배너가 없습니다.
                  </td>
                </tr>
              ) : (
                banners.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/banners/${b.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {b.title}
                      </Link>
                      {b.description ? (
                        <p className="mt-0.5 text-xs text-zinc-500">{b.description}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">{b.position}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-zinc-900">
                      {b.displayOrder}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {b.buttonText ? (
                        <>
                          <span className="font-bold">{b.buttonText}</span>
                          <span className="ml-1 text-zinc-400">→ {b.buttonLink || "-"}</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {b.isPublished ? (
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
                          href={`/admin/banners/${b.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        <BannerRowActions id={b.id} />
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
