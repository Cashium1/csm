import { listPublicNotices } from "@/lib/admin";
import { NoticeList } from "./notice-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function NoticesPage() {
  const entries = listPublicNotices();
  // 기존 NoticeList는 lib/data.ts의 Notice 구조를 기대하므로 모양만 맞춰 전달합니다.
  const notices = entries.map((entry) => ({
    title: entry.title,
    date: entry.date,
    summary: entry.summary,
    content: entry.content,
  }));

  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-extrabold text-[#b77900]">NOTICE</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950">공지사항</h1>
        <p className="mt-4 text-base leading-7 text-zinc-600">
          캐쉬움 서비스 운영과 자료 업데이트 안내를 확인하세요.
        </p>

        {notices.length === 0 ? (
          <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            등록된 공지가 없습니다.
          </div>
        ) : (
          <NoticeList notices={notices} />
        )}
      </div>
    </section>
  );
}
