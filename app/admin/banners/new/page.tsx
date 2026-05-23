import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth";
import { BannerForm } from "../banner-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBannerCreatePage() {
  await requirePermissionPage("manage:banners");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/banners" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 배너 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 배너 등록</h1>
      </div>
      <BannerForm mode="create" initial={null} />
    </div>
  );
}
