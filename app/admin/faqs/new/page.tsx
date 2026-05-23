import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth";
import { FaqForm } from "../faq-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFaqCreatePage() {
  await requirePermissionPage("manage:faqs");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/faqs" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← FAQ 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 FAQ 등록</h1>
      </div>
      <FaqForm mode="create" initial={null} />
    </div>
  );
}
