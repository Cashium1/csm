import Link from "next/link";
import { FILE_TYPE_LABEL, listAdminFiles } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { FileRowActions } from "./file-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatSize(size: number | null) {
  if (!size) return "-";
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

export default async function AdminFilesPage() {
  await requirePermissionPage("manage:files");
  const files = listAdminFiles();
  const active = files.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">파일 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {files.length}개 · 활성 {active}개. PDF 파일은 구매 권한 검증을 거쳐서만 열람됩니다.
          </p>
        </div>
        <Link
          href="/admin/files/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 파일 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">파일명</th>
                <th className="px-5 py-3 text-left">유형</th>
                <th className="px-5 py-3 text-left">연결된 강의</th>
                <th className="px-5 py-3 text-right">크기</th>
                <th className="px-5 py-3 text-left">업로드일</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    등록된 파일이 없습니다.
                  </td>
                </tr>
              ) : (
                files.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/files/${f.id}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {f.fileName}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-zinc-500">{f.fileUrl}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">
                      {FILE_TYPE_LABEL[f.fileType] ?? f.fileType}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {f.relatedCourseTitle ?? "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-zinc-600">{formatSize(f.fileSize)}</td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateFormatter.format(new Date(f.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {f.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                          활성
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
                          비활성
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/files/${f.id}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        {f.isActive ? (
                          <FileRowActions
                            id={f.id}
                            hasCourse={Boolean(f.relatedCourseId)}
                            courseTitle={f.relatedCourseTitle ?? ""}
                          />
                        ) : null}
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
