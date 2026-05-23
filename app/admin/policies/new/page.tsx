import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth";
import { PolicyForm } from "../policy-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPolicyNewPage() {
  await requirePermissionPage("manage:policies");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/policies" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 약관/정책으로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 정책 버전 등록</h1>
        <p className="mt-1 text-xs text-zinc-500">
          기존 버전은 보관되며, 새 버전을 활성화로 등록하면 사용자 화면이 즉시 새 내용으로 갱신됩니다.
        </p>
      </div>
      <PolicyForm initial={null} />
    </div>
  );
}
