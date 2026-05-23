import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { createAdminCourse, type CourseInput } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = Partial<CourseInput> & { slug?: unknown };

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function asNumber(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function asBool(v: unknown) {
  return v === true || v === "true" || v === 1;
}

export async function POST(request: NextRequest) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const input: CourseInput = {
    title: asString(body.title),
    summary: asString(body.summary),
    description: asString(body.description),
    groupKey: asString(body.groupKey),
    category: asString(body.category),
    priceNumber: asNumber(body.priceNumber),
    discountPrice: asNumber(body.discountPrice),
    thumbnail: asString(body.thumbnail),
    materialPdf: asString(body.materialPdf),
    level: asString(body.level) || "입문",
    duration: asString(body.duration) || "30분",
    recommendedFor: asString(body.recommendedFor),
    outcomes: asString(body.outcomes),
    isPublished: asBool(body.isPublished),
    isOnSale: asBool(body.isOnSale),
  };

  const slug = asString(body.slug);
  const result = createAdminCourse(slug, input);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, slug: result.slug }, { status: 201 });
}
