import Link from "next/link";
import { listAdminMembers } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}

function statusBadge(status: string) {
  if (status === "blocked") {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">
        차단
      </span>
    );
  }
  if (status === "deleted") {
    return (
      <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
        탈퇴
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
      활성
    </span>
  );
}

export default async function AdminMembersPage() {
  const members = listAdminMembers();
  const admins = members.filter((m) => m.role === "admin").length;
  const blocked = members.filter((m) => m.status === "blocked").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">회원 관리</h1>
        <p className="mt-1 text-sm text-zinc-500">
          전체 {members.length}명 · 관리자 {admins}명 · 차단 {blocked}명
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">이름</th>
                <th className="px-5 py-3 text-left">이메일</th>
                <th className="px-5 py-3 text-left">가입일</th>
                <th className="px-5 py-3 text-right">구매 강의</th>
                <th className="px-5 py-3 text-right">총 결제 금액</th>
                <th className="px-5 py-3 text-center">권한</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-zinc-400">
                    가입한 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5 font-extrabold text-zinc-900">
                      <Link href={`/admin/members/${m.id}`} className="hover:underline">
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-700">{m.email}</td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {dateFormatter.format(new Date(m.createdAt))}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {m.purchaseCount}개
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-zinc-900">
                      {formatWon(m.totalSpent)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {m.role === "admin" ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-800">
                          관리자
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
                          일반
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">{statusBadge(m.status)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                      >
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
