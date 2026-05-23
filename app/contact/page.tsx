import { getCurrentUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const user = await getCurrentUser();

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">CONTACT</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">문의하기</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          강의·결제·환불 등 궁금하신 내용을 남겨주세요. 운영팀이 확인 후 답변드립니다.
        </p>

        <ContactForm
          defaultName={user?.name ?? ""}
          defaultEmail={user?.email ?? ""}
          isLoggedIn={Boolean(user)}
        />
      </div>
    </section>
  );
}
