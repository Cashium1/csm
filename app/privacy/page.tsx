export default function PrivacyPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">PRIVACY</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">개인정보처리방침</h1>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-7 text-zinc-600 shadow-sm">
          <p>
            본 페이지는 MVP용 개인정보처리방침 화면입니다. 추천 설문, 계정, 결제 정보를 실제로 저장하기 전
            수집 항목과 보관 기간, 파기 절차를 명확히 정리해야 합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
