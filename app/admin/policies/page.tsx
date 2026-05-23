import Link from "next/link";
import {
  listAdminPolicies,
  POLICY_TYPES,
  POLICY_TYPE_LABEL,
  type Policy,
} from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { PolicyActivateButton } from "./policy-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminPoliciesPage() {
  await requirePermissionPage("manage:policies");
  const all = listAdminPolicies();

  const byType: Record<string, Policy[]> = {};
  for (const p of all) {
    if (!byType[p.policyType]) byType[p.policyType] = [];
    byType[p.policyType].push(p);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-950">약관/정책 관리</h1>
          <p className="mt-1 text-sm text-zinc-500">
            정책 문서는 버전으로 관리됩니다. 새 버전을 등록하면 기존 버전을 덮어쓰지 않고 별도로 보관됩니다.
          </p>
        </div>
        <Link
          href="/admin/policies/new"
          className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-zinc-800"
        >
          + 새 버전 등록
        </Link>
      </div>

      {POLICY_TYPES.map((pt) => {
        const versions = byType[pt.key] ?? [];
        return (
          <section
            key={pt.key}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm"
          >
            <div className="border-b border-zinc-100 px-5 py-4">
              <h2 className="text-sm font-black text-zinc-950">{pt.label}</h2>
            </div>
            <div className="overflow-x-auto">
              {versions.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-zinc-400">
                  등록된 버전이 없습니다. 새 버전을 등록해 주세요.
                </p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-5 py-2.5 text-left">버전</th>
                      <th className="px-5 py-2.5 text-left">제목</th>
                      <th className="px-5 py-2.5 text-center">상태</th>
                      <th className="px-5 py-2.5 text-left">작성일</th>
                      <th className="px-5 py-2.5 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {versions.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/60">
                        <td className="px-5 py-3 font-mono font-extrabold text-zinc-900">v{p.version}</td>
                        <td className="px-5 py-3 text-zinc-700">{p.title}</td>
                        <td className="px-5 py-3 text-center">
                          {p.isActive ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                              활성
                            </span>
                          ) : (
                            <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
                              비활성
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-zinc-600">
                          {dateTimeFormatter.format(new Date(p.createdAt))}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link
                              href={`/admin/policies/${p.id}`}
                              className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                            >
                              상세보기
                            </Link>
                            {!p.isActive ? (
                              <PolicyActivateButton id={p.id} typeLabel={POLICY_TYPE_LABEL[pt.key]} />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
