import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import {
  deleteAdminCourse,
  getAdminCourse,
  setCourseOnSale,
  setCoursePublished,
  updateAdminCourse,
  type CourseInput,
} from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpdateBody = Partial<CourseInput> & { isPublished?: unknown; isOnSale?: unknown };

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

type Ctx = { params: Promise<{ slug: string }> };

// 강의 수정 + 부분 상태 토글(isPublished/isOnSale)을 한 라우트에서 처리합니다.
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { slug } = await params;
  const existing = getAdminCourse(slug);
  if (!existing) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as UpdateBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  // 부분 토글 요청 감지: 본문 키가 isPublished/isOnSale 둘 중 하나만 있는 경우
  const keys = Object.keys(body);
  if (keys.length === 1 && keys[0] === "isPublished") {
    setCoursePublished(slug, asBool(body.isPublished));
    return NextResponse.json({ ok: true });
  }
  if (keys.length === 1 && keys[0] === "isOnSale") {
    setCourseOnSale(slug, asBool(body.isOnSale));
    return NextResponse.json({ ok: true });
  }

  // 전체 수정
  const input: CourseInput = {
    title: asString(body.title) || existing.title,
    summary: asString(body.summary),
    description: asString(body.description),
    groupKey: asString(body.groupKey) || existing.groupKey,
    category: asString(body.category),
    priceNumber: asNumber(body.priceNumber),
    discountPrice: asNumber(body.discountPrice),
    thumbnail: asString(body.thumbnail),
    materialPdf: asString(body.materialPdf),
    level: asString(body.level) || existing.level,
    duration: asString(body.duration) || existing.duration,
    recommendedFor: asString(body.recommendedFor),
    outcomes: asString(body.outcomes),
    isPublished: asBool(body.isPublished),
    isOnSale: asBool(body.isOnSale),
  };

  const result = updateAdminCourse(slug, input);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { slug } = await params;
  const existing = getAdminCourse(slug);
  if (!existing) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const result = deleteAdminCourse(slug);
  return NextResponse.json({ ok: true, softDeleted: result.softDeleted });
}
