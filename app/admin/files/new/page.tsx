import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth";
import { FileForm } from "../file-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFileCreatePage() {
  await requirePermissionPage("manage:files");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/files" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 파일 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 파일 등록</h1>
      </div>
      <FileForm mode="create" initial={null} />
    </div>
  );
}
