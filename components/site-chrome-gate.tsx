"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// 관리자 페이지에서는 공개 사이트의 헤더/푸터를 숨깁니다.
export function SiteChromeGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return <>{children}</>;
}
