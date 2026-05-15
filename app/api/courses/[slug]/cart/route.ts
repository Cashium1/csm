import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { addCourseToCart, removeCourseFromCart } from "@/lib/course-library";
import { getCourse } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: CartRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 강의를 담을 수 있습니다." }, { status: 401 });
  }

  const result = addCourseToCart(user.id, slug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: CartRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }

  removeCourseFromCart(user.id, slug);

  return NextResponse.json({ ok: true });
}
