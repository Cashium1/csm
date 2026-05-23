import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminFaq } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { FaqForm } from "../faq-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFaqEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:faqs");
  const { id } = await params;
  const faq = getAdminFaq(id);
  if (!faq) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/faqs" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← FAQ 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">FAQ 수정</h1>
      </div>
      <FaqForm mode="edit" initial={faq} />
    </div>
  );
}
