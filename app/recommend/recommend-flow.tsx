"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryGroups, courses, type TrackKey } from "@/lib/data";

type Option = {
  value: string;
  label: string;
  description: string;
  scores: Partial<Record<TrackKey, number>>;
  reason: string;
};

type Question = {
  id: string;
  title: string;
  options: Option[];
};

const questions: Question[] = [
  {
    id: "work-style",
    title: "혼자 조용히 하는 일이 편한가요, 사람과 소통하는 일이 편한가요?",
    options: [
      {
        value: "quiet",
        label: "혼자 집중하는 편",
        description: "글, 자료 정리, 콘텐츠 제작처럼 깊게 몰입하는 일이 편합니다.",
        scores: { content: 3, service: 1 },
        reason: "혼자 집중하는 답변이 콘텐츠형과 잘 맞습니다.",
      },
      {
        value: "social",
        label: "소통이 있는 편",
        description: "고객 응대, 제안, 운영처럼 사람과 연결되는 일이 괜찮습니다.",
        scores: { sales: 2, marketing: 2, service: 2 },
        reason: "소통을 부담스럽게 느끼지 않아 판매형과 서비스형도 고려할 수 있습니다.",
      },
    ],
  },
  {
    id: "content-interest",
    title: "콘텐츠 제작에 관심이 있나요?",
    options: [
      {
        value: "yes",
        label: "관심이 있어요",
        description: "글, 영상, 숏폼, 이미지 등 무언가를 만들어보고 싶습니다.",
        scores: { content: 4, marketing: 1 },
        reason: "콘텐츠 제작 관심도가 높아 콘텐츠 수익형이 유리합니다.",
      },
      {
        value: "not-main",
        label: "주력은 아니에요",
        description: "콘텐츠보다 운영, 판매, 도구 활용 쪽이 더 편합니다.",
        scores: { sales: 2, service: 2 },
        reason: "콘텐츠가 주력이 아니어도 판매형이나 실행형으로 시작할 수 있습니다.",
      },
    ],
  },
  {
    id: "sales-interest",
    title: "판매/운영형 일에 흥미가 있나요?",
    options: [
      {
        value: "yes",
        label: "흥미가 있어요",
        description: "상품, 가격, 고객 응대, 운영 흐름을 다루는 일이 궁금합니다.",
        scores: { sales: 4, marketing: 1 },
        reason: "상품과 운영에 관심이 있어 판매 / 유통형 적합도가 높습니다.",
      },
      {
        value: "no",
        label: "부담스러워요",
        description: "재고, CS, 배송보다 콘텐츠나 디지털 산출물이 편합니다.",
        scores: { content: 2, service: 2 },
        reason: "재고와 운영 부담을 줄이는 콘텐츠형 또는 서비스형이 더 편할 수 있습니다.",
      },
    ],
  },
  {
    id: "weekly-time",
    title: "일주일에 투자 가능한 시간은 어느 정도인가요?",
    options: [
      {
        value: "light",
        label: "3시간 이하",
        description: "짧게 읽고 작은 실험부터 시작하고 싶습니다.",
        scores: { marketing: 2, service: 2, content: 1 },
        reason: "투입 시간이 적어 작게 검증하는 모델부터 보는 것이 좋습니다.",
      },
      {
        value: "steady",
        label: "4~8시간",
        description: "주 2~3회 정도 꾸준히 시간을 낼 수 있습니다.",
        scores: { content: 2, sales: 2, marketing: 2, service: 2 },
        reason: "꾸준한 시간이 있어 여러 모델을 비교하며 선택할 수 있습니다.",
      },
      {
        value: "deep",
        label: "9시간 이상",
        description: "학습과 실행을 함께 하며 깊게 실험할 수 있습니다.",
        scores: { sales: 3, service: 3, content: 2 },
        reason: "충분한 시간이 있어 운영형이나 서비스형도 현실적으로 검토할 수 있습니다.",
      },
    ],
  },
  {
    id: "quick-start",
    title: "초보자도 빠르게 시작 가능한 분야를 원하나요?",
    options: [
      {
        value: "quick",
        label: "네, 작게 시작하고 싶어요",
        description: "큰 준비보다 작은 테스트와 빠른 이해가 중요합니다.",
        scores: { marketing: 3, service: 2, content: 1 },
        reason: "작은 테스트를 선호해 마케팅 / 연결형이나 실행형이 잘 맞습니다.",
      },
      {
        value: "structured",
        label: "구조를 잡고 천천히 해도 괜찮아요",
        description: "시간이 걸려도 누적되는 모델을 이해하고 싶습니다.",
        scores: { content: 3, sales: 2 },
        reason: "천천히 누적하는 방식도 괜찮아 콘텐츠형과 판매형을 볼 수 있습니다.",
      },
    ],
  },
  {
    id: "interest-area",
    title: "AI 툴 활용, 글쓰기, 마케팅, 상품 판매 중 어떤 쪽에 더 관심이 있나요?",
    options: [
      {
        value: "ai",
        label: "AI 툴 활용",
        description: "도구를 활용해 산출물이나 작은 서비스를 만들어보고 싶습니다.",
        scores: { service: 5 },
        reason: "AI 도구 활용 관심이 높아 서비스 / 실행형 추천 근거가 분명합니다.",
      },
      {
        value: "writing",
        label: "글쓰기와 콘텐츠",
        description: "블로그, 뉴스레터, 영상 기획처럼 콘텐츠 기반 모델이 끌립니다.",
        scores: { content: 5 },
        reason: "글쓰기와 콘텐츠 관심이 콘텐츠 수익형과 직접 연결됩니다.",
      },
      {
        value: "marketing",
        label: "마케팅과 링크 수익",
        description: "콘텐츠와 상품을 연결해 전환을 만드는 과정이 궁금합니다.",
        scores: { marketing: 5 },
        reason: "전환과 링크 수익에 관심이 있어 마케팅 / 연결형이 어울립니다.",
      },
      {
        value: "selling",
        label: "상품 판매",
        description: "상품을 고르고 판매 흐름을 운영하는 일이 궁금합니다.",
        scores: { sales: 5 },
        reason: "상품 판매 관심이 분명해 판매 / 유통형을 먼저 볼 만합니다.",
      },
    ],
  },
];

const primaryCourseByTrack: Record<TrackKey, string> = {
  content: "blog-monetization",
  sales: "ecommerce-basic",
  marketing: "affiliate-marketing",
  service: "ai-service-builder",
};

export function RecommendFlow() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const activeQuestion = questions[current];
  const progress = completed ? 100 : Math.round((current / questions.length) * 100);

  const selectedOptions = useMemo(
    () =>
      questions
        .map((question) => question.options.find((option) => option.value === answers[question.id]))
        .filter((option): option is Option => Boolean(option)),
    [answers],
  );

  const results = useMemo(() => {
    const scores: Record<TrackKey, number> = {
      content: 0,
      sales: 0,
      marketing: 0,
      service: 0,
    };

    selectedOptions.forEach((option) => {
      (Object.entries(option.scores) as [TrackKey, number][]).forEach(([track, value]) => {
        scores[track] += value;
      });
    });

    return (Object.entries(scores) as [TrackKey, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([track, score]) => {
        const group = categoryGroups.find((item) => item.key === track);
        const course = courses.find((item) => item.slug === primaryCourseByTrack[track]);

        return {
          track,
          score,
          title: group?.title ?? "추천 카테고리",
          description: group?.description ?? "",
          categories: group?.categories.slice(0, 3) ?? [],
          course,
        };
      });
  }, [selectedOptions]);

  function selectOption(option: Option) {
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: option.value }));
    if (current === questions.length - 1) {
      setCompleted(true);
      return;
    }
    setCurrent((prev) => prev + 1);
  }

  function goBack() {
    if (completed) {
      setCompleted(false);
      setCurrent(questions.length - 1);
      return;
    }
    setCurrent((prev) => Math.max(prev - 1, 0));
  }

  function resetSurvey() {
    setAnswers({});
    setCurrent(0);
    setCompleted(false);
  }

  return (
    <div className="mt-10 rounded-lg border border-zinc-200 bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] sm:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm font-bold text-zinc-600">
          <span>{completed ? "추천 결과" : `${current + 1} / ${questions.length}`}</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full rounded-full bg-[#ffd84d] transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {!completed ? (
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-950">{activeQuestion.title}</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {activeQuestion.options.map((option) => {
              const selected = answers[activeQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option)}
                  className={`rounded-lg border p-5 text-left transition ${
                    selected
                      ? "border-[#f2c230] bg-[#fff9dc]"
                      : "border-zinc-200 bg-white hover:border-[#f2c230] hover:bg-[#fffdf2]"
                  }`}
                >
                  <span className="text-base font-extrabold text-zinc-950">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-zinc-600">{option.description}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              disabled={current === 0}
              className="rounded-full px-4 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300"
            >
              이전
            </button>
            <p className="text-sm font-bold text-zinc-500">캐쉬움 추천 설문</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="rounded-lg bg-[#fff9dc] p-5">
            <p className="text-sm font-extrabold text-[#8a5a00]">추천 완료</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
              지금은 이 방향부터 살펴보는 것이 좋습니다
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              아래 추천은 답변 기반의 출발점입니다. 수익을 보장하기보다, 어떤 구조를 먼저 이해하면 좋을지
              좁혀주는 역할을 합니다.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {results.map((result, index) => (
              <article key={result.track} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-[#b77900]">추천 {index + 1}</p>
                    <h3 className="mt-1 text-xl font-black text-zinc-950">{result.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{result.description}</p>
                  </div>
                  <span className="w-fit rounded-full bg-zinc-950 px-3 py-1 text-xs font-bold text-white">
                    적합도 {Math.min(98, 62 + result.score * 2)}%
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.categories.map((category) => (
                    <span key={category} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
                      {category}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-lg bg-zinc-50 p-4">
                  <p className="text-sm font-extrabold text-zinc-950">왜 추천하나요?</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600">
                    {selectedOptions.slice(-3).map((option) => (
                      <li key={option.value}>{option.reason}</li>
                    ))}
                  </ul>
                </div>
                {result.course ? (
                  <Link
                    href={`/courses/${result.course.slug}`}
                    className="mt-5 inline-flex rounded-full bg-[#ffd84d] px-5 py-3 text-sm font-extrabold text-zinc-950 transition hover:bg-[#f2c230]"
                  >
                    추천 강의 보기
                  </Link>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={resetSurvey}
              className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-extrabold text-zinc-800 transition hover:border-zinc-950"
            >
              다시 진단하기
            </button>
            <Link
              href="/courses"
              className="inline-flex justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-zinc-800"
            >
              전체 강의 둘러보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
