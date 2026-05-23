import Link from "next/link";
import { listAdminCourses, COURSE_GROUPS } from "@/lib/admin";
import { CourseRowActions } from "./course-row-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function groupLabel(key: string) {
  return COURSE_GROUPS.find((g) => g.key === key)?.label ?? key;
}

function formatWon(n: number) {
  return n === 0 ? "무료" : `${n.toLocaleString("ko-KR")}원`;
}

export default async function AdminCoursesPage() {
  const courses = listAdminCourses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">강의 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            전체 {courses.length}개 강의 · 공개/비공개와 판매중/판매중지를 토글로 즉시 변경할 수 있습니다.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 강의 등록
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">제목</th>
                <th className="px-5 py-3 text-left">대분류</th>
                <th className="px-5 py-3 text-left">세부 카테고리</th>
                <th className="px-5 py-3 text-right">가격</th>
                <th className="px-5 py-3 text-center">공개</th>
                <th className="px-5 py-3 text-center">판매</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-zinc-400">
                    등록된 강의가 없습니다.
                  </td>
                </tr>
              ) : (
                courses.map((c) => (
                  <tr key={c.slug} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/courses/${c.slug}`}
                        className="font-extrabold text-zinc-950 hover:underline"
                      >
                        {c.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-zinc-500">{c.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">{groupLabel(c.groupKey)}</td>
                    <td className="px-5 py-3.5 text-zinc-700">{c.category}</td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {formatWon(c.priceNumber)}
                      {c.discountPrice > 0 && c.discountPrice < c.priceNumber ? (
                        <div className="text-xs font-bold text-emerald-600">
                          → {formatWon(c.discountPrice)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <CourseRowActions
                        slug={c.slug}
                        kind="published"
                        value={c.isPublished}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <CourseRowActions slug={c.slug} kind="onSale" value={c.isOnSale} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Link
                          href={`/admin/courses/${c.slug}`}
                          className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                        >
                          수정
                        </Link>
                        <CourseRowActions slug={c.slug} kind="delete" />
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
