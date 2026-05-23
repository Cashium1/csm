import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminReview } from "@/lib/admin-extra";
import { ReviewToggle } from "../review-toggle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const review = getAdminReview(id);
  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/reviews"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 리뷰 관리로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">리뷰 상세</h1>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                review.status === "hidden"
                  ? "bg-zinc-200 text-zinc-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {review.status === "hidden" ? "숨김" : "노출"}
            </span>
            <ReviewToggle id={review.id} status={review.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 text-amber-500">
            <span className="text-lg font-black">{"★".repeat(review.rating)}</span>
            <span className="text-zinc-300">{"★".repeat(5 - review.rating)}</span>
            <span className="ml-2 text-sm font-bold text-zinc-700">{review.rating}점</span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
            {review.content}
          </p>
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">강의</h2>
            <p className="mt-2 font-extrabold text-zinc-900">
              <Link href={`/admin/courses/${review.courseSlug}`} className="hover:underline">
                {review.courseTitle}
              </Link>
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">작성자</h2>
            <p className="mt-2 font-extrabold text-zinc-900">{review.userName}</p>
            <p className="text-xs text-zinc-500">{review.userEmail}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">시각</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">작성</dt>
                <dd className="font-bold text-zinc-800">
                  {dateTimeFormatter.format(new Date(review.createdAt))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">수정</dt>
                <dd className="font-bold text-zinc-800">
                  {dateTimeFormatter.format(new Date(review.updatedAt))}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
