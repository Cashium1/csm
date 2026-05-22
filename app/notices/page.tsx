import { notices } from "@/lib/data";
import { NoticeList } from "./notice-list";

export default function NoticesPage() {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">NOTICE</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">공지사항</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">캐쉬움 서비스 운영과 자료 업데이트 안내를 확인하세요.</p>

        <NoticeList notices={notices} />
      </div>
    </section>
  );
}
