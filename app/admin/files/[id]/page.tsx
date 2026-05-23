import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminFile } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { FileForm } from "../file-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFileEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:files");
  const { id } = await params;
  const file = getAdminFile(id);
  if (!file) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/files" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 파일 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">파일 수정</h1>
      </div>
      <FileForm mode="edit" initial={file} />
    </div>
  );
}
