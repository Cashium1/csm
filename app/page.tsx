import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { SectionHeading } from "@/components/section-heading";
import { categoryGroups } from "@/lib/data";
import { listPublicCourses } from "@/lib/public-courses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reasonCards = [
  {
    title: "무엇이 나에게 맞는지 모르겠다",
    description: "콘텐츠, 판매, 마케팅, 서비스형 중 어디서 시작해야 할지 먼저 정리합니다.",
  },
  {
    title: "정보를 찾아봐도 너무 길고 복잡하다",
    description: "긴 영상과 흩어진 글 대신 핵심 구조를 짧은 자료로 이해합니다.",
  },
  {
    title: "비싼 강의 전에 구조부터 이해하고 싶다",
    description: "결제 전 큰 방향과 수익 흐름을 확인해 시행착오를 줄입니다.",
  },
];

const steps = [
  { title: "짧은 설문에 답하기", description: "성향, 관심사, 가능한 시간을 간단히 선택합니다." },
  { title: "추천 카테고리 확인", description: "콘텐츠형, 판매형, 마케팅형, 실행형 중 맞는 방향을 봅니다." },
  { title: "핵심 구조 학습", description: "수익 흐름과 시작 전 알아야 할 기준을 빠르게 익힙니다." },
];

const differences = [
  "초보자도 이해할 수 있게 설계된 구조",
  "실행에 필요한 핵심만 정리",
  "복잡한 이론보다 실전 이해 중심",
  "내 성향에 맞는 방향부터 탐색",
];

const faqs = [
  {
    question: "어떤 사람에게 적합한가요?",
    answer: "부업에 관심은 있지만 무엇부터 시작할지 막막한 초보자에게 적합합니다.",
  },
  {
    question: "강의 형식은 어떻게 되나요?",
    answer: "텍스트, PDF, 이미지와 도식 중심의 짧은 학습 자료로 구성됩니다.",
  },
  {
    question: "영상 강의도 있나요?",
    answer: "현재 MVP는 빠른 이해를 위한 문서형 자료 중심입니다. 필요한 주제는 이후 짧은 영상도 검토합니다.",
  },
  {
    question: "추천 받은 카테고리 외 다른 강의도 볼 수 있나요?",
    answer: "네. 추천은 시작점을 돕기 위한 기능이며, 전체 강의 목록에서 자유롭게 탐색할 수 있습니다.",
  },
  {
    question: "결제 후 바로 수강 가능한가요?",
    answer: "결제 완료 후 마이페이지에서 바로 자료를 확인하는 흐름을 기준으로 설계되어 있습니다.",
  },
];

export default function Home() {
  // 관리자가 수정한 강의 정보가 즉시 반영되도록 DB에서 공개 강의를 읽습니다.
  const publicCourses = listPublicCourses();
  const featuredCourses = publicCourses.slice(0, 3);
  const representativeCategories = publicCourses.slice(0, 6);

  return (
    <>
      <section className="bg-[linear-gradient(180deg,#fff9dc_0%,#ffffff_86%)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.86fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#f3cf55] bg-white px-3 py-2 text-sm font-bold text-[#8a5a00] shadow-sm">
              사용자 맞춤형 부업 추천 및 학습 플랫폼
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              나에게 맞는 부업부터 찾고, 핵심 구조부터 이해하세요
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-700 sm:text-lg">
              캐쉬움은 사용자 성향에 맞는 부업 카테고리를 추천하고, 각 부업의 수익 구조와 시작 방법을
              짧고 명확하게 학습할 수 있도록 돕는 실전형 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/recommend"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-4 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(24,24,27,0.18)] transition hover:bg-zinc-800"
              >
                맞춤 추천 받기
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-4 text-base font-extrabold text-zinc-900 transition hover:border-zinc-950"
              >
                강의 둘러보기
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
              {["추천 이유 제공", "PDF 중심 학습", "초보자 기준 설명"].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-white/80 px-4 py-3 font-semibold">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 h-20 w-20 rounded-full bg-[#dff7ec]" />
            <div className="absolute -right-2 bottom-10 h-16 w-16 rounded-full bg-[#e8f0ff]" />
            <div className="relative rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_24px_70px_rgba(24,24,27,0.14)]">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <p className="text-xs font-extrabold text-[#b77900]">Cashoom Fit Check</p>
                  <h2 className="mt-1 text-lg font-black text-zinc-950">내 부업 추천 결과</h2>
                </div>
                <span className="rounded-full bg-[#fff4c4] px-3 py-1 text-xs font-extrabold text-[#8a5a00]">
                  3분 설문
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  ["콘텐츠 수익형", "82%", "bg-[#ffd84d]"],
                  ["마케팅 / 연결형", "71%", "bg-[#9fe7bf]"],
                  ["서비스 / 실행형", "64%", "bg-[#b9cdfc]"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-lg bg-zinc-50 p-4">
                    <div className="mb-3 flex items-center justify-between text-sm font-bold text-zinc-800">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full ${color}`} style={{ width: value }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-[#f3cf55] bg-[#fff9dc] p-4">
                <p className="text-sm font-extrabold text-zinc-950">추천 이유</p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  글쓰기와 콘텐츠 실험에 관심이 있고, 초기 비용보다 꾸준한 학습과 검증을 선호하는 답변이
                  많았습니다.
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-zinc-950 p-4 text-white">
                  <p className="text-xs font-bold text-zinc-300">첫 추천 강의</p>
                  <p className="mt-2 font-extrabold">블로그 수익화 구조</p>
                </div>
                <div className="rounded-lg bg-[#ffd84d] p-4 text-zinc-950">
                  <p className="text-xs font-bold text-[#8a5a00]">학습 방식</p>
                  <p className="mt-2 font-extrabold">PDF + 도식</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="WHY CASHOOM"
            title="부업 정보가 많을수록, 먼저 구조가 필요합니다"
            description="캐쉬움은 자극적인 성공담보다 시작 전 판단에 필요한 기준을 먼저 보여줍니다."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {reasonCards.map((card, index) => (
              <article key={card.title} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff4c4] text-sm font-black text-[#8a5a00]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-zinc-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow="PERSONAL FIT"
              title="설문 기반 추천이 캐쉬움의 시작점입니다"
              description="성향과 선호를 바탕으로 콘텐츠형, 판매형, 마케팅형, 실행형 중 맞는 방향을 제안하고 추천 이유를 함께 보여줍니다."
            />
            <Link
              href="/recommend"
              className="mt-8 inline-flex rounded-full bg-[#ffd84d] px-6 py-4 text-base font-extrabold text-zinc-950 shadow-sm transition hover:bg-[#f2c230]"
            >
              내게 맞는 부업 찾기
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {categoryGroups.map((group) => (
              <article key={group.key} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-extrabold text-zinc-950">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{group.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.categories.slice(0, 3).map((category) => (
                    <span key={category} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                      {category}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="CATEGORIES"
            title="대표 부업 카테고리"
            description="각 카테고리는 수익이 만들어지는 방식과 시작 전 확인할 기준을 중심으로 정리됩니다."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {representativeCategories.map((course) => (
              <article key={course.slug} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-extrabold text-zinc-950">{course.category}</h3>
                  <span className="rounded-full bg-[#fff4c4] px-3 py-1 text-xs font-bold text-[#8a5a00]">
                    {course.level}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{course.summary}</p>
                <p className="mt-4 text-sm font-bold text-zinc-800">{course.target}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="HOW IT WORKS"
            title="3단계로 가볍게 시작하세요"
            description="먼저 맞는 방향을 찾고, 그 다음 필요한 구조만 빠르게 학습합니다."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 text-base font-black text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-zinc-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <SectionHeading
            eyebrow="LEARNING FORMAT"
            title="긴 영상보다, 실행 전 이해에 필요한 핵심만"
            description="텍스트, PDF, 이미지와 도식 중심으로 빠르게 읽고 판단할 수 있도록 구성합니다."
          />
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <p className="text-xs font-extrabold text-[#b77900]">콘텐츠 미리보기</p>
                  <h3 className="mt-1 text-lg font-black text-zinc-950">제휴 마케팅 수익 흐름</h3>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">PDF 16p</span>
              </div>
              <div className="mt-5 grid gap-3">
                {["빠르게 읽을 수 있는 구조", "핵심만 정리된 콘텐츠", "초보자도 따라가기 쉬운 설명", "필요한 정보 중심"].map(
                  (item) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg bg-zinc-50 p-4">
                      <span className="h-3 w-3 rounded-full bg-[#ffd84d]" />
                      <span className="text-sm font-bold text-zinc-800">{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="POPULAR TRACKS"
              title="추천 강의와 인기 트랙"
              description="부업을 시작하기 전 많이 확인하는 핵심 구조형 강의입니다."
            />
            <Link href="/courses" className="font-extrabold text-zinc-950 underline decoration-[#ffd84d] decoration-4">
              전체 강의 보기
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.slug} course={course} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <SectionHeading
            eyebrow="DIFFERENCE"
            title="캐쉬움은 먼저 판단 기준을 만듭니다"
            description="부업을 고르기 전, 내 성향과 모델의 구조가 맞는지 확인할 수 있도록 설계했습니다."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {differences.map((item) => (
              <div key={item} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <span className="block h-2 w-10 rounded-full bg-[#ffd84d]" />
                <p className="mt-4 text-base font-extrabold leading-7 text-zinc-950">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading align="center" eyebrow="FAQ" title="자주 묻는 질문" />
          <div className="mt-10 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="cursor-pointer list-none text-base font-extrabold text-zinc-950">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
