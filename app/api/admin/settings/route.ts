import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings, type SiteSettingsInput } from "@/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

export async function PATCH(request: NextRequest) {
  const admin = requirePermissionFromRequest(request, "manage:settings");
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const before = getSiteSettings();
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const input: SiteSettingsInput = {
    siteName: asString(body.siteName) || "캐쉬움",
    siteDescription: asString(body.siteDescription),
    customerEmail: asString(body.customerEmail),
    customerServiceHours: asString(body.customerServiceHours),
    companyName: asString(body.companyName),
    representativeName: asString(body.representativeName),
    businessNumber: asString(body.businessNumber),
    ecommerceRegistrationNumber: asString(body.ecommerceRegistrationNumber),
    businessAddress: asString(body.businessAddress),
    phoneNumber: asString(body.phoneNumber),
    footerCopyright: asString(body.footerCopyright),
    metaTitle: asString(body.metaTitle),
    metaDescription: asString(body.metaDescription),
    metaKeywords: asString(body.metaKeywords),
    ogImageUrl: asString(body.ogImageUrl),
    faviconUrl: asString(body.faviconUrl),
    termsUrl: asString(body.termsUrl) || "/terms",
    privacyUrl: asString(body.privacyUrl) || "/privacy",
    refundPolicyUrl: asString(body.refundPolicyUrl) || "/refund-policy",
  };

  updateSiteSettings(input);

  logAdminAction({
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for") ?? null,
      userAgent: request.headers.get("user-agent") ?? null,
    },
    actionType: "update",
    targetType: "setting",
    targetId: "site_settings",
    targetName: "사이트 설정",
    description: "사이트 설정값을 변경했습니다.",
    beforeData: before,
    afterData: input,
  });

  return NextResponse.json({ ok: true });
}
