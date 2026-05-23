import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminBanner } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { BannerForm } from "../banner-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminBannerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:banners");
  const { id } = await params;
  const banner = getAdminBanner(id);
  if (!banner) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/banners" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 배너 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">배너 수정</h1>
      </div>
      <BannerForm mode="edit" initial={banner} />
    </div>
  );
}
