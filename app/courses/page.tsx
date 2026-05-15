import { SectionHeading } from "@/components/section-heading";
import { CourseCatalog } from "./course-catalog";

export default function CoursesPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="COURSES"
          title="카테고리별 강의 목록"
          description="관심 있는 부업 카테고리를 고르고, 난이도와 학습 시간을 기준으로 가볍게 비교해보세요."
        />
        <CourseCatalog />
      </div>
    </section>
  );
}
