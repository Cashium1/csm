export default function TermsPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">TERMS</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">이용약관</h1>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-600 shadow-sm">
          <p>
            본 페이지는 MVP용 약관 화면입니다. 캐쉬움은 사용자 맞춤 추천과 문서형 학습 자료를 제공하며,
            실제 서비스 운영 전 법무 검토를 거친 정식 약관으로 교체해야 합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
