const stats = [
  ["회원 수", "1,248"],
  ["등록 강의", "8개"],
  ["이번 달 결제", "186건"],
  ["공지", "3건"],
];

const menus = [
  {
    title: "회원 관리",
    description: "가입 회원, 추천 결과, 수강 상태를 확인합니다.",
    items: ["신규 가입 24명", "추천 완료 318건", "휴면 전환 6명"],
  },
  {
    title: "강의 관리",
    description: "강의 목록, 가격, 자료 형식, 노출 태그를 관리합니다.",
    items: ["검수 대기 2개", "인기 강의 3개", "가격 변경 요청 1건"],
  },
  {
    title: "결제 관리",
    description: "주문 내역, 환불 요청, 결제 상태를 간단히 확인합니다.",
    items: ["결제 완료 186건", "환불 요청 2건", "미확인 주문 0건"],
  },
  {
    title: "공지 관리",
    description: "서비스 안내와 자료 업데이트 공지를 작성합니다.",
    items: ["게시 중 3건", "임시 저장 1건", "예약 게시 0건"],
  },
];

export default function AdminPage() {
  return (
    <section className="bg-zinc-100 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#b77900]">ADMIN</p>
            <h1 className="mt-2 text-2xl font-black text-zinc-950">캐쉬움 운영 대시보드</h1>
          </div>
          <button type="button" className="w-fit rounded-full bg-zinc-950 px-5 py-3 text-sm font-extrabold text-white">
            관리자 로그아웃
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-zinc-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-zinc-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {menus.map((menu) => (
            <section key={menu.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-zinc-950">{menu.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{menu.description}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-extrabold text-zinc-700"
                >
                  관리
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {menu.items.map((item) => (
                  <div key={item} className="flex items-center justify-between rounded-lg bg-zinc-50 p-4 text-sm">
                    <span className="font-bold text-zinc-700">{item}</span>
                    <span className="h-2 w-2 rounded-full bg-[#ffd84d]" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
