import { SectionHeading } from "@/components/section-heading";
import { RecommendFlow } from "./recommend-flow";

// 사이트 설정/푸터가 항상 최신 값으로 반영되도록 동적 렌더링합니다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function RecommendPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="FIT SURVEY"
          title="내게 맞는 부업 카테고리 찾기"
          description="정답을 맞히는 설문이 아니라, 시작 전 방향을 좁히기 위한 짧은 온보딩입니다."
        />
        <RecommendFlow />
      </div>
    </section>
  );
}
