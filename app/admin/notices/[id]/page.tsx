import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminNotice } from "@/lib/admin";
import { NoticeForm } from "../notice-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminNoticeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notice = getAdminNotice(id);
  if (!notice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/notices"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 공지사항 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">공지 수정</h1>
      </div>
      <NoticeForm mode="edit" initial={notice} />
    </div>
  );
}
