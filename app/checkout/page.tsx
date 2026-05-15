import Link from "next/link";
import { courses, getCourse } from "@/lib/data";
import { CheckoutButton } from "./checkout-button";

type CheckoutPageProps = {
  searchParams: Promise<{ course?: string | string[] }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const courseSlug = Array.isArray(params.course) ? params.course[0] : params.course;
  const course = courseSlug ? getCourse(courseSlug) : courses[0];

  if (!course) {
    return (
      <section className="bg-zinc-50 py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h1 className="text-2xl font-black text-zinc-950">상품을 찾을 수 없습니다</h1>
          <Link href="/courses" className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white">
            강의 목록으로 이동
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <p className="text-sm font-extrabold text-[#b77900]">CHECKOUT</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">강의 결제</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            결제 전 주문 내용을 확인해 주세요. 캐쉬움은 과장된 수익 약속이 아니라, 시작 전 필요한 구조 이해를
            돕는 자료를 제공합니다.
          </p>

          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-zinc-950">결제 안내</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
              <li>결제 완료 후 마이페이지에서 학습 자료를 확인할 수 있습니다.</li>
              <li>자료 형식은 PDF, 텍스트, 이미지 및 도식 중심입니다.</li>
              <li>수익을 보장하는 상품이 아니며, 부업 구조를 이해하기 위한 교육 자료입니다.</li>
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.08)]">
          <h2 className="text-lg font-black text-zinc-950">주문 요약</h2>
          <div className="mt-5 rounded-lg bg-zinc-50 p-4">
            <p className="text-sm font-bold text-zinc-500">상품명</p>
            <p className="mt-2 text-base font-extrabold text-zinc-950">{course.title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{course.summary}</p>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-5">
            <span className="text-sm font-bold text-zinc-600">결제 금액</span>
            <span className="text-2xl font-black text-zinc-950">{course.price}</span>
          </div>
          <CheckoutButton courseSlug={course.slug} />
          <p className="mt-4 text-xs leading-5 text-zinc-500">
            현재 화면은 MVP용 결제 UI입니다. 버튼을 누르면 결제 완료 상태로 처리됩니다.
          </p>
        </aside>
      </div>
    </section>
  );
}
