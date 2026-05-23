import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { deleteAdminNotice, updateAdminNotice } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}
function asBool(v: unknown) {
  return v === true || v === "true" || v === 1;
}

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const admin = requireAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });
  }

  const result = updateAdminNotice(id, {
    title: asString(body.title),
    content: asString(body.content),
    isPublished: asBool(body.isPublished),
    isPinned: asBool(body.isPinned),
  });

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

  const { id } = await params;
  deleteAdminNotice(id);
  return NextResponse.json({ ok: true });
}
