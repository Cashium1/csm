import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { completeCourse } from "@/lib/course-library";
import { getCourse } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompleteRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: CompleteRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  const result = completeCourse(user.id, slug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
