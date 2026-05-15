import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { purchaseCourse } from "@/lib/purchases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PurchaseRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: PurchaseRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 결제할 수 있습니다." }, { status: 401 });
  }

  const result = purchaseCourse(user.id, slug);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
