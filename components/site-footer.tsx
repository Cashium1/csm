import Link from "next/link";

const footerLinks = [
  { href: "/notices", label: "공지사항" },
  { href: "/contact", label: "문의하기" },
  { href: "/terms", label: "이용약관" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/login", label: "로그인 / 회원가입" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffd84d] text-xs font-black text-zinc-950">
                캐
              </span>
              <span className="text-lg font-extrabold text-zinc-950">캐쉬움</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
              비싼 강의를 결제하기 전에, 온라인 부업의 구조를 먼저 이해할 수 있도록 돕는 학습 플랫폼입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-zinc-600">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-zinc-950">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Cashoom. All rights reserved.</p>
          <p>수익 보장이 아닌 구조 이해와 방향 탐색을 위한 교육 자료를 제공합니다.</p>
        </div>
      </div>
    </footer>
  );
}
