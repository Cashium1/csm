import { redirect } from "next/navigation";
import {
  getCartCoursesForUser,
  getCompletedCoursesForUser,
  getInProgressCoursesForUser,
  getPaymentHistoryForUser,
} from "@/lib/course-library";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import { MyPageContent } from "./mypage-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const cartCourses = getCartCoursesForUser(user.id);
  const inProgressCourses = getInProgressCoursesForUser(user.id);
  const completedCourses = getCompletedCoursesForUser(user.id);
  const paymentHistory = getPaymentHistoryForUser(user.id);

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-extrabold text-[#b77900]">MY PAGE</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">마이페이지</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              왼쪽 메뉴에서 강의 목록, 결제 내역, 회원 정보를 선택해 확인하세요.
            </p>
          </div>
          <LogoutButton />
        </div>

        <MyPageContent
          user={{ name: user.name, email: user.email, createdAt: user.createdAt }}
          cartCourses={cartCourses}
          inProgressCourses={inProgressCourses}
          completedCourses={completedCourses}
          paymentHistory={paymentHistory}
        />
      </div>
    </section>
  );
}
