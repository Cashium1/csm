import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCourse } from "@/lib/admin";
import { CourseForm } from "../course-form";
import { CourseSalesPanel } from "./sales-panel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getAdminCourse(slug);
  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 강의 관리로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">강의 수정</h1>
          <p className="text-xs text-zinc-500">
            슬러그: <span className="font-bold text-zinc-700">{course.slug}</span>
          </p>
        </div>
      </div>
      <CourseSalesPanel slug={course.slug} />

      <CourseForm mode="edit" initial={course} />
    </div>
  );
}
