"use client";

import { useRouter } from "next/navigation";
import { SyntheticEvent, useState } from "react";
import type { Coupon, CouponDiscountType, CouponStatus } from "@/lib/coupons";

const labelCls = "grid gap-2 text-sm font-bold text-zinc-700";
const inputCls =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#f2c230]";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  // ISO → "YYYY-MM-DDTHH:MM" (datetime-local)
  return iso.slice(0, 16);
}

export function CouponForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: Coupon | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    initial?.discountType ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState(String(initial?.discountValue ?? 10));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    initial?.maxDiscountAmount === null || initial?.maxDiscountAmount === undefined
      ? ""
      : String(initial.maxDiscountAmount),
  );
  const [minOrderAmount, setMinOrderAmount] = useState(String(initial?.minOrderAmount ?? 0));
  const [appliesToAllCourses, setAppliesToAllCourses] = useState(
    initial?.appliesToAllCourses ?? true,
  );
  const [applicableCourseIds, setApplicableCourseIds] = useState(
    (initial?.applicableCourseIds ?? []).join("\n"),
  );
  const [usageLimit, setUsageLimit] = useState(
    initial?.usageLimit === null || initial?.usageLimit === undefined
      ? ""
      : String(initial.usageLimit),
  );
  const [userLimit, setUserLimit] = useState(String(initial?.userLimit ?? 1));
  const [startsAt, setStartsAt] = useState(toLocalDatetime(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalDatetime(initial?.endsAt ?? null));
  const [status, setStatus] = useState<CouponStatus>(initial?.status ?? "active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setNotice({ text: "쿠폰명을 입력해 주세요.", tone: "error" });
      return;
    }
    if (!code.trim()) {
      setNotice({ text: "쿠폰 코드를 입력해 주세요.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    const payload = {
      name,
      code,
      discountType,
      discountValue: Math.max(0, Number(discountValue) || 0),
      maxDiscountAmount: maxDiscountAmount === "" ? null : Number(maxDiscountAmount) || null,
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      appliesToAllCourses,
      applicableCourseIds: appliesToAllCourses
        ? []
        : applicableCourseIds
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean),
      applicableCategoryIds: [] as string[],
      usageLimit: usageLimit === "" ? null : Number(usageLimit) || null,
      userLimit: Math.max(0, Number(userLimit) || 0),
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      status,
    };

    const url = mode === "create" ? "/api/admin/coupons" : `/api/admin/coupons/${initial?.id}`;
    const response = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice({ text: data.message ?? "저장에 실패했습니다.", tone: "error" });
      return;
    }

    if (mode === "create") {
      router.push("/admin/coupons");
    } else {
      router.refresh();
      setNotice({ text: "저장되었습니다.", tone: "ok" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">기본 정보</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            쿠폰명 <span className="text-red-500">*</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </label>
          <label className={labelCls}>
            쿠폰 코드 <span className="text-red-500">*</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className={`${inputCls} font-mono`}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">할인 설정</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            할인 방식
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as CouponDiscountType)}
              className={inputCls}
            >
              <option value="percentage">정률 할인 (%)</option>
              <option value="fixed_amount">정액 할인 (원)</option>
            </select>
          </label>
          <label className={labelCls}>
            할인 값 ({discountType === "percentage" ? "%" : "원"})
            <input
              type="number"
              min={0}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            최대 할인 금액(원, 비워두면 미적용)
            <input
              type="number"
              min={0}
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            최소 결제 금액(원)
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">적용 대상</h2>
        <div className="mt-4 space-y-3">
          <label className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-bold text-zinc-800">
            <input
              type="checkbox"
              checked={appliesToAllCourses}
              onChange={(e) => setAppliesToAllCourses(e.target.checked)}
            />
            전체 강의에 적용
          </label>
          {!appliesToAllCourses ? (
            <label className={labelCls}>
              적용할 강의 슬러그 (한 줄에 하나)
              <textarea
                value={applicableCourseIds}
                onChange={(e) => setApplicableCourseIds(e.target.value)}
                rows={4}
                placeholder="ai-service-builder&#10;instagram-reels-ai"
                className={inputCls}
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">사용 제한 / 기간</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className={labelCls}>
            전체 사용 가능 횟수 (비워두면 무제한)
            <input
              type="number"
              min={0}
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            사용자별 사용 횟수 (0이면 무제한)
            <input
              type="number"
              min={0}
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            시작일
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            종료일
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className={labelCls}>
            상태
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CouponStatus)}
              className={inputCls}
            >
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="expired">만료</option>
            </select>
          </label>
        </div>
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

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-extrabold text-zinc-700 transition hover:border-zinc-950"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {isSubmitting ? "저장 중..." : mode === "create" ? "등록하기" : "저장하기"}
        </button>
      </div>
    </form>
  );
}
