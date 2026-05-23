import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import {
  getAdminCoupon,
  setCouponStatus,
  updateAdminCoupon,
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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:coupons");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminCoupon(id);
  if (!before) return NextResponse.json({ message: "쿠폰을 찾을 수 없습니다." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });

  // 부분 상태 토글: body에 status만 있는 경우
  if (Object.keys(body).length === 1 && (body.status === "active" || body.status === "inactive" || body.status === "expired")) {
    setCouponStatus(id, body.status as CouponStatus);
    logAdminAction({
      admin: { id: admin.id, name: admin.name, email: admin.email,
        ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
      actionType: body.status === "active" ? "enable" : "disable",
      targetType: "coupon",
      targetId: id,
      targetName: `${before.name} (${before.code})`,
      description: `쿠폰 상태를 ${body.status}로 변경했습니다.`,
      beforeData: { status: before.status },
      afterData: { status: body.status },
    });
    return NextResponse.json({ ok: true });
  }

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

  const result = updateAdminCoupon(id, input);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "update",
    targetType: "coupon",
    targetId: id,
    targetName: `${input.name} (${input.code})`,
    description: "쿠폰을 수정했습니다.",
    beforeData: before,
    afterData: input,
  });

  return NextResponse.json({ ok: true });
}
