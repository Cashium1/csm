import { redirect } from "next/navigation";
import { getCurrentUser, initializeAuthDatabase } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  initializeAuthDatabase();

  const user = await getCurrentUser();

  if (user) {
    redirect("/mypage");
  }

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-extrabold text-[#b77900]">ACCOUNT</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">로그인 / 회원가입</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-zinc-600">
            이메일과 비밀번호로 캐쉬움 계정을 만들고, 추천 결과와 구매한 강의를 한곳에서 확인하세요.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-zinc-600">
            {["내 추천 결과 저장", "구매 강의 바로 보기", "결제 내역 확인"].map((item) => (
              <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 font-bold shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <LoginForm />
      </div>
    </section>
  );
}
