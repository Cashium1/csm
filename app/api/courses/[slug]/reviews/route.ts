import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { getCourse } from "@/lib/data";
import { hasCourseAccess } from "@/lib/purchases";
import { upsertCourseReview, validateReviewFields } from "@/lib/course-reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: NextRequest, { params }: ReviewRouteContext) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return NextResponse.json({ message: "강의를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = getCurrentUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ message: "로그인 후 후기를 작성할 수 있습니다." }, { status: 401 });
  }

  if (!hasCourseAccess(user.id, slug)) {
    return NextResponse.json({ message: "수강 중인 강의만 후기를 작성할 수 있습니다." }, { status: 403 });
  }

  const body = await readJson(request);
  const { rating, content, errors, isValid } = validateReviewFields(body.rating, body.content);

  if (!isValid || !rating || !content) {
    return NextResponse.json({ message: "후기 내용을 확인해 주세요.", errors }, { status: 400 });
  }

  const review = upsertCourseReview({
    courseSlug: slug,
    userId: user.id,
    rating,
    content,
  });

  return NextResponse.json({ review }, { status: 201 });
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as { rating?: unknown; content?: unknown };
  } catch {
    return {};
  }
}
