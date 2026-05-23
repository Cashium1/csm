import type { Metadata } from "next";
import "./globals.css";
import { SiteChromeGate } from "@/components/site-chrome-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const s = getSiteSettings();
  return {
    title:
      s.metaTitle ||
      s.siteName ||
      "캐쉬움 | 사용자 맞춤형 부업 추천 및 학습 플랫폼",
    description:
      s.metaDescription ||
      s.siteDescription ||
      "나에게 맞는 부업 카테고리를 추천받고, 수익 구조와 시작 방법을 짧고 명확하게 학습하세요.",
    keywords: s.metaKeywords ? s.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
    icons: s.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: s.ogImageUrl
      ? {
          title: s.metaTitle || s.siteName,
          description: s.metaDescription || s.siteDescription,
          images: [{ url: s.ogImageUrl }],
        }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <SiteChromeGate>
          <SiteHeader />
        </SiteChromeGate>
        <main className="flex-1">{children}</main>
        <SiteChromeGate>
          <SiteFooter />
        </SiteChromeGate>
      </body>
    </html>
  );
}
