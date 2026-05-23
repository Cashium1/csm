import Link from "next/link";
import { NoticeForm } from "../notice-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminNoticeCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/notices"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 공지사항 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 공지 등록</h1>
      </div>
      <NoticeForm mode="create" initial={null} />
    </div>
  );
}
