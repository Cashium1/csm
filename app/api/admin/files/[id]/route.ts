import { NextRequest, NextResponse } from "next/server";
import { logAdminAction } from "@/lib/activity-log";
import { requirePermissionFromRequest } from "@/lib/auth";
import {
  deactivateFile,
  getAdminFile,
  updateFile,
  type FileInput,
} from "@/lib/admin-extra2";

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
  const admin = requirePermissionFromRequest(request, "manage:files");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminFile(id);
  if (!before) return NextResponse.json({ message: "파일을 찾을 수 없습니다." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ message: "잘못된 요청입니다." }, { status: 400 });

  const input: FileInput = {
    fileName: asString(body.fileName),
    fileType: asString(body.fileType) || "pdf",
    fileUrl: asString(body.fileUrl),
    fileSize:
      body.fileSize === null || body.fileSize === undefined || body.fileSize === ""
        ? null
        : Number(body.fileSize) || null,
    relatedCourseId:
      typeof body.relatedCourseId === "string" && body.relatedCourseId.trim()
        ? body.relatedCourseId.trim()
        : null,
    relatedCourseTitle:
      typeof body.relatedCourseTitle === "string" && body.relatedCourseTitle.trim()
        ? body.relatedCourseTitle.trim()
        : null,
    isActive: asBool(body.isActive),
  };

  const result = updateFile(id, input);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: 400 });

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "update",
    targetType: "file",
    targetId: id,
    targetName: input.fileName,
    description: "파일 정보를 수정했습니다.",
    beforeData: before,
    afterData: input,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const admin = requirePermissionFromRequest(request, "manage:files");
  if (!admin) return NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 });

  const { id } = await params;
  const before = getAdminFile(id);
  if (!before) return NextResponse.json({ message: "파일을 찾을 수 없습니다." }, { status: 404 });

  deactivateFile(id);

  logAdminAction({
    admin: { id: admin.id, name: admin.name, email: admin.email,
      ipAddress: request.headers.get("x-forwarded-for"), userAgent: request.headers.get("user-agent") },
    actionType: "disable",
    targetType: "file",
    targetId: id,
    targetName: before.fileName,
    description: "파일을 비활성화했습니다.",
    beforeData: { isActive: before.isActive },
    afterData: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
