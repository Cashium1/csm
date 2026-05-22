import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/data";

type CourseCardProps = {
  course: Course;
  compact?: boolean;
  footer?: React.ReactNode;
};

const cardClassName =
  "group flex h-full flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#f2c230] hover:shadow-[0_18px_45px_rgba(24,24,27,0.10)]";

export function CourseCard({ course, compact = false, footer }: CourseCardProps) {
  const body = (
    <>
      <div className="relative aspect-video overflow-hidden bg-zinc-100">
        <Image
          src={course.thumbnail}
          alt={`${course.title} 강의 썸네일`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-md bg-[#ffd84d] px-3 py-1 text-xs font-black text-zinc-950 shadow-sm">
          {course.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md border border-[#f2c230] bg-white px-2.5 py-1 text-xs font-bold text-[#8a5a00]">
            {course.cardCategory}
          </span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {course.level}
          </span>
        </div>

        <h3 className="mt-3 text-base font-black leading-6 text-zinc-950 transition group-hover:text-[#8a5a00]">
          {course.title}
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-zinc-600">{course.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-zinc-100 pt-4">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="text-lg font-black text-[#f2a900]">{course.price}</span>
            {!compact ? (
              <span className="text-sm font-bold text-zinc-400 line-through">{course.originalPrice}</span>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-1 text-sm">
            <span className="text-[#f2b705]" aria-hidden="true">
              ★
            </span>
            <span className="font-bold text-zinc-800">{course.rating.toFixed(1)}</span>
            <span className="text-zinc-400">({course.reviewCount.toLocaleString("ko-KR")})</span>
          </div>
        </div>
      </div>
    </>
  );

  if (footer) {
    return (
      <article className={cardClassName}>
        <Link href={`/courses/${course.slug}`} className="flex flex-1 flex-col">
          {body}
        </Link>
        <div className="border-t border-zinc-100 p-4">{footer}</div>
      </article>
    );
  }

  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <article className={cardClassName}>{body}</article>
    </Link>
  );
}
