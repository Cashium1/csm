import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { hasCourseAccess } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MaterialRouteContext = {
  params: Promise<{ slug: string }>;
};

function pdfHeaders(fileName: string) {
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${fileName}"`,
    "Cache-Control": "private, no-store",
  };
}

// 강의 PDF 자료를 권한 확인 후 제공합니다.
// 본인이 수강 중(결제 또는 무료 수강 신청)인 강의의 자료만 열람할 수 있습니다.
export async function GET(request: NextRequest, { params }: MaterialRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  if (user.status === "blocked" || user.status === "deleted") {
    return NextResponse.json(
      { message: "차단되었거나 사용할 수 없는 계정입니다." },
      { status: 403 },
    );
  }

  if (!hasCourseAccess(user.id, slug)) {
    return NextResponse.json(
      { message: "수강 중인 강의만 자료를 확인할 수 있습니다." },
      { status: 403 },
    );
  }

  const source = course.materialPdf;

  // 외부 URL 자료: 서버가 대신 받아 스트리밍해 원본 주소를 노출하지 않습니다.
  if (/^https?:\/\//i.test(source)) {
    const upstream = await fetch(source).catch(() => null);

    if (!upstream || !upstream.ok || !upstream.body) {
      return NextResponse.json({ message: "자료를 불러오지 못했습니다." }, { status: 502 });
    }

    return new NextResponse(upstream.body, { status: 200, headers: pdfHeaders(`${slug}.pdf`) });
  }

  // 로컬 자료: public 밖의 비공개 폴더에서 읽어 제공합니다.
  const fileName = path.basename(source);
  const filePath = path.join(process.cwd(), "private", "course-materials", fileName);

  try {
    const file = await readFile(filePath);
    return new NextResponse(new Uint8Array(file), { status: 200, headers: pdfHeaders(fileName) });
  } catch {
    return NextResponse.json({ message: "자료 파일을 찾을 수 없습니다." }, { status: 404 });
  }
}
