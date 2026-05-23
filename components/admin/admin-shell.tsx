"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ADMIN_ROLE_LABEL, hasPermission, type Permission } from "@/lib/permissions";

type AdminShellUser = {
  name: string;
  email: string;
  role: string;
};

type NavItem = {
  href: string;
  label: string;
  permission: Permission;
  soon?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "운영 현황",
    items: [
      { href: "/admin/dashboard", label: "대시보드", permission: "view:dashboard" },
      { href: "/admin/stats", label: "매출 통계", permission: "view:stats" },
      { href: "/admin/logs", label: "활동 로그", permission: "view:logs" },
    ],
  },
  {
    label: "콘텐츠",
    items: [
      { href: "/admin/courses", label: "강의 관리", permission: "manage:courses" },
      { href: "/admin/categories", label: "카테고리 관리", permission: "manage:categories", soon: true },
      { href: "/admin/notices", label: "공지사항 관리", permission: "manage:notices" },
      { href: "/admin/faqs", label: "FAQ 관리", permission: "manage:faqs" },
      { href: "/admin/banners", label: "배너 관리", permission: "manage:banners" },
      { href: "/admin/files", label: "파일 관리", permission: "manage:files" },
    ],
  },
  {
    label: "회원·결제",
    items: [
      { href: "/admin/members", label: "회원 관리", permission: "view:members" },
      { href: "/admin/payments", label: "결제 관리", permission: "manage:payments" },
      { href: "/admin/coupons", label: "쿠폰 관리", permission: "manage:coupons" },
    ],
  },
  {
    label: "지원",
    items: [
      { href: "/admin/inquiries", label: "문의 관리", permission: "manage:inquiries" },
      { href: "/admin/reviews", label: "리뷰 관리", permission: "view:reviews" },
    ],
  },
  {
    label: "설정",
    items: [
      { href: "/admin/settings", label: "사이트 설정", permission: "manage:settings" },
      { href: "/admin/policies", label: "약관/정책", permission: "manage:policies" },
      { href: "/admin/emails", label: "이메일 템플릿", permission: "manage:email_templates" },
    ],
  },
];

export function AdminShell({ user, children }: { user: AdminShellUser; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="border-b border-zinc-100 px-5 py-5">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-950 px-2 py-1 text-[11px] font-black tracking-wider text-white">
              ADMIN
            </span>
            <span className="text-base font-extrabold tracking-tight text-zinc-950">캐쉬움</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((it) => hasPermission(user.role, it.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (pathname !== null && pathname.startsWith(item.href + "/"));
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold transition ${
                            isActive
                              ? "bg-zinc-900 text-white"
                              : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.soon ? (
                            <span
                              className={`text-[10px] font-extrabold tracking-wider ${
                                isActive ? "text-zinc-300" : "text-zinc-400"
                              }`}
                            >
                              SOON
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500">
          관리자 콘솔 v3.0
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider text-zinc-500">
              {ADMIN_ROLE_LABEL[user.role as keyof typeof ADMIN_ROLE_LABEL] ?? "ADMINISTRATOR"}
            </p>
            <p className="truncate text-sm font-extrabold text-zinc-950">
              {user.name}
              <span className="ml-2 font-bold text-zinc-500">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
            >
              사용자 사이트
            </Link>
            <Link
              href="/mypage"
              className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-zinc-800"
            >
              마이페이지
            </Link>
          </div>
        </header>
        <main className="flex-1 px-6 py-7">{children}</main>
      </div>
    </div>
  );
}
