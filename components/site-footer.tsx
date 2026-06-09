import Link from "next/link";
import Image from "next/image";
import { getSiteSettings } from "@/lib/site-settings";

export function SiteFooter() {
  const settings = getSiteSettings();

  // 사이트 설정에서 약관/정책 링크를 가져옵니다. (관리자에서 경로 변경 가능)
  const footerLinks = [
    { href: "/notices", label: "공지사항" },
    { href: "/contact", label: "문의하기" },
    { href: settings.termsUrl || "/terms", label: "이용약관" },
    { href: settings.privacyUrl || "/privacy", label: "개인정보처리방침" },
    { href: settings.refundPolicyUrl || "/refund-policy", label: "환불정책" },
    { href: "/login", label: "로그인 / 회원가입" },
  ];

  const brandName = settings.siteName || "캐쉬움";

  // 비어 있지 않은 사업자 정보 항목만 표시합니다.
  const businessItems: { label: string; value: string }[] = [
    { label: "상호", value: settings.companyName },
    { label: "대표", value: settings.representativeName },
    { label: "사업자등록번호", value: settings.businessNumber },
    { label: "통신판매업신고", value: settings.ecommerceRegistrationNumber },
    { label: "주소", value: settings.businessAddress },
    { label: "전화", value: settings.phoneNumber },
    { label: "이메일", value: settings.customerEmail },
    { label: "고객센터 운영시간", value: settings.customerServiceHours },
  ].filter((item) => item.value.trim() !== "");

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="" width={141} height={139} className="h-8 w-auto" />
              <span className="text-lg font-extrabold text-zinc-950">{brandName}</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
              {settings.siteDescription ||
                "비싼 강의를 결제하기 전에, 온라인 부업의 구조를 먼저 이해할 수 있도록 돕는 학습 플랫폼입니다."}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-zinc-600">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-zinc-950">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {businessItems.length > 0 ? (
          <dl className="grid gap-x-6 gap-y-1.5 border-t border-zinc-100 pt-6 text-xs leading-5 text-zinc-500 sm:grid-cols-2 lg:grid-cols-3">
            {businessItems.map((item) => (
              <div key={item.label} className="flex gap-1.5">
                <dt className="shrink-0 font-bold text-zinc-600">{item.label}</dt>
                <dd className="wrap-break-word">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>{settings.footerCopyright || `© 2026 ${brandName}. All rights reserved.`}</p>
          <p>수익 보장이 아닌 구조 이해와 방향 탐색을 위한 교육 자료를 제공합니다.</p>
        </div>
      </div>
    </footer>
  );
}
