import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import {
  createAdminCoupon,
  type CouponDiscountType,
  type CouponInput,
  type CouponStatus,
} from "@/lib/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function asBool(v: unknown) {
  return v === true || v === "true" || v === 1;
}
function asNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(request: NextRequest) {
  const admin = requirePermissionFromRequest(request, "manage:coupons");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });

  const discountType: CouponDiscountType =
    body.discountType === "fixed_amount" ? "fixed_amount" : "percentage";
  const status: CouponStatus =
    body.status === "inactive"
      ? "inactive"
      : body.status === "expired"
        ? "expired"
        : "active";

  const input: CouponInput = {
    name: asString(body.name),
    code: asString(body.code),
    discountType,
    discountValue: Number(body.discountValue) || 0,
    maxDiscountAmount: asNumOrNull(body.maxDiscountAmount),
    minOrderAmount: Number(body.minOrderAmount) || 0,
    appliesToAllCourses: asBool(body.appliesToAllCourses),
    applicableCourseIds: Array.isArray(body.applicableCourseIds)
      ? body.applicableCourseIds.map(String)
      : [],
    applicableCategoryIds: Array.isArray(body.applicableCategoryIds)
      ? body.applicableCategoryIds.map(String)
      : [],
    usageLimit: asNumOrNull(body.usageLimit),
    userLimit: Number(body.userLimit) || 0,
    startsAt: typeof body.startsAt === "string" ? body.startsAt : null,
    endsAt: typeof body.endsAt === "string" ? body.endsAt : null,
    status,
  };

  const result = createAdminCoupon(input);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
    actionType: "create",
    targetType: "coupon",
    targetId: result.id,
    targetName: `${input.name} (${input.code})`,
    description: "새 쿠폰을 등록했습니다.",
    afterData: input,
  });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}
