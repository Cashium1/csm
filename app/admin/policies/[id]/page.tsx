import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminPolicy, POLICY_TYPE_LABEL } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:policies");
  const { id } = await params;
  const policy = getAdminPolicy(id);
  if (!policy) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/policies" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 약관/정책으로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">
            {POLICY_TYPE_LABEL[policy.policyType] ?? policy.policyType} · v{policy.version}
          </h1>
          {policy.isActive ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              활성 버전
            </span>
          ) : (
            <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-black text-zinc-600">
              비활성
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          작성: {dateTimeFormatter.format(new Date(policy.createdAt))}
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black text-zinc-950">{policy.title}</h2>
        <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-zinc-700">{policy.content}</p>
      </section>

      <p className="text-xs text-zinc-500">
        ※ 정책 문서는 직접 수정할 수 없습니다. 변경 사항이 있으면 새 버전으로 등록해 주세요.
      </p>
    </div>
  );
}
