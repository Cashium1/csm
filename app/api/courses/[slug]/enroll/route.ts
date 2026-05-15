import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { enrollFreeCourse } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnrollRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: EnrollRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 무료 강의를 수강할 수 있습니다." }, { status: 401 });
  }

  if (course.priceNumber !== 0) {
    return NextResponse.json({ message: "무료 강의만 바로 수강할 수 있습니다." }, { status: 400 });
  }

  const result = enrollFreeCourse(user.id, slug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
