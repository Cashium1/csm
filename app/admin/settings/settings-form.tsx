"use client";

import { SyntheticEvent, useState } from "react";
import type { SiteSettings } from "@/lib/site-settings";

type Tab = "basic" | "footer" | "seo" | "support";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "basic", label: "기본 정보" },
  { key: "support", label: "고객센터" },
  { key: "footer", label: "푸터/사업자" },
  { key: "seo", label: "SEO" },
];

type FormState = Omit<SiteSettings, "updatedAt">;

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState<FormState>({
    siteName: initial.siteName,
    siteDescription: initial.siteDescription,
    customerEmail: initial.customerEmail,
    customerServiceHours: initial.customerServiceHours,
    companyName: initial.companyName,
    representativeName: initial.representativeName,
    businessNumber: initial.businessNumber,
    ecommerceRegistrationNumber: initial.ecommerceRegistrationNumber,
    businessAddress: initial.businessAddress,
    phoneNumber: initial.phoneNumber,
    footerCopyright: initial.footerCopyright,
    metaTitle: initial.metaTitle,
    metaDescription: initial.metaDescription,
    metaKeywords: initial.metaKeywords,
    ogImageUrl: initial.ogImageUrl,
    faviconUrl: initial.faviconUrl,
    termsUrl: initial.termsUrl,
    privacyUrl: initial.privacyUrl,
    refundPolicyUrl: initial.refundPolicyUrl,
  });
  const [tab, setTab] = useState<Tab>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }
    setNotice({ text: "사이트 설정이 저장되었습니다.", tone: "ok" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-extrabold transition ${
              tab === t.key
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        {tab === "basic" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              사이트명
              <input
                value={form.siteName}
                onChange={(e) => update("siteName", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              사이트 한 줄 소개
              <input
                value={form.siteDescription}
                onChange={(e) => update("siteDescription", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              파비콘 URL
              <input
                value={form.faviconUrl}
                onChange={(e) => update("faviconUrl", e.target.value)}
                placeholder="/favicon.ico"
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              OG 이미지 URL
              <input
                value={form.ogImageUrl}
                onChange={(e) => update("ogImageUrl", e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            </label>
          </div>
        ) : null}

        {tab === "support" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              고객센터 이메일
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => update("customerEmail", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              고객센터 운영 시간
              <input
                value={form.customerServiceHours}
                onChange={(e) => update("customerServiceHours", e.target.value)}
                placeholder="평일 10:00 - 18:00"
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              대표 연락처
              <input
                value={form.phoneNumber}
                onChange={(e) => update("phoneNumber", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        ) : null}

        {tab === "footer" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className={labelCls}>
              회사명
              <input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              대표자명
              <input
                value={form.representativeName}
                onChange={(e) => update("representativeName", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              사업자등록번호
              <input
                value={form.businessNumber}
                onChange={(e) => update("businessNumber", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              통신판매업 신고번호
              <input
                value={form.ecommerceRegistrationNumber}
                onChange={(e) => update("ecommerceRegistrationNumber", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              사업장 주소
              <input
                value={form.businessAddress}
                onChange={(e) => update("businessAddress", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={`${labelCls} md:col-span-2`}>
              푸터 저작권 문구
              <input
                value={form.footerCopyright}
                onChange={(e) => update("footerCopyright", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              이용약관 링크
              <input
                value={form.termsUrl}
                onChange={(e) => update("termsUrl", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              개인정보처리방침 링크
              <input
                value={form.privacyUrl}
                onChange={(e) => update("privacyUrl", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              환불정책 링크
              <input
                value={form.refundPolicyUrl}
                onChange={(e) => update("refundPolicyUrl", e.target.value)}
                className={inputCls}
              />
            </label>
          </div>
        ) : null}

        {tab === "seo" ? (
          <div className="grid gap-4">
            <label className={labelCls}>
              기본 메타 타이틀
              <input
                value={form.metaTitle}
                onChange={(e) => update("metaTitle", e.target.value)}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              기본 메타 설명
              <textarea
                value={form.metaDescription}
                onChange={(e) => update("metaDescription", e.target.value)}
                rows={3}
                className={inputCls}
              />
            </label>
            <label className={labelCls}>
              대표 키워드 (콤마로 구분)
              <input
                value={form.metaKeywords}
                onChange={(e) => update("metaKeywords", e.target.value)}
                placeholder="부업, 강의, 추천"
                className={inputCls}
              />
            </label>
          </div>
        ) : null}
      </section>

      {notice ? (
        <p
          className={`rounded-lg p-3 text-sm font-bold ${
            notice.tone === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "저장 중..." : "전체 저장"}
        </button>
      </div>
    </form>
  );
}
