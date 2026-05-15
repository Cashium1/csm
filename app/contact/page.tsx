export default function ContactPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">CONTACT</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">문의하기</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          강의, 결제, 제휴, 자료 오류와 관련된 문의는 아래 구글폼으로 남겨주세요. 확인 후 순차적으로 답변드립니다.
        </p>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-zinc-950">구글폼으로 문의 접수</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            강의명, 문의 유형, 답변받을 이메일을 남겨주시면 영업일 기준으로 순차 확인합니다.
          </p>
          <a
            href="https://forms.google.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full bg-[#ffd84d] px-6 py-4 text-sm font-black text-zinc-950 transition hover:bg-[#f2c230]"
          >
            문의 구글폼 열기
          </a>
        </div>
      </div>
    </section>
  );
}
