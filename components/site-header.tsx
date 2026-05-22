import Link from "next/link";
import Image from "next/image";
import { HeaderAuthControls } from "@/components/header-auth-controls";

const navItems = [
  { href: "/recommend", label: "맞춤 추천" },
  { href: "/courses", label: "강의" },
  { href: "/notices", label: "공지사항" },
  { href: "/contact", label: "문의" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="캐쉬움 홈">
          <Image src="/logo.png" alt="" width={141} height={139} className="h-9 w-auto" priority />
          <span className="text-lg font-extrabold tracking-tight text-zinc-950">캐쉬움</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-600 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-zinc-950">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end">
          <HeaderAuthControls />
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 text-sm font-semibold text-zinc-600 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-2"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
