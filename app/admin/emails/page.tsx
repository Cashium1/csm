import Link from "next/link";
import { listEmailLogs, listEmailTemplates } from "@/lib/admin-extra2";
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

export default async function AdminEmailsPage() {
  await requirePermissionPage("manage:email_templates");
  const templates = listEmailTemplates();
  const logs = listEmailLogs(20);
  const active = templates.filter((t) => t.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">이메일 템플릿</h1>
        <p className="mt-1 text-sm text-zinc-500">
          전체 {templates.length}개 · 활성 {active}개. RESEND_API_KEY 환경변수가 설정되면 실제 메일이 발송됩니다.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-black text-zinc-950">템플릿 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">이벤트</th>
                <th className="px-5 py-3 text-left">템플릿명</th>
                <th className="px-5 py-3 text-left">제목</th>
                <th className="px-5 py-3 text-center">상태</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50/60">
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-700">{t.eventType}</td>
                  <td className="px-5 py-3.5 font-extrabold text-zinc-900">{t.templateName}</td>
                  <td className="px-5 py-3.5 text-zinc-600">{t.subject}</td>
                  <td className="px-5 py-3.5 text-center">
                    {t.isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                        활성
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-black text-zinc-600">
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/admin/emails/${t.id}`}
                      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-black text-zinc-950">최근 발송 로그 (최대 20건)</h2>
        </div>
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-zinc-400">
              아직 발송 기록이 없습니다.
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-2.5 text-left">시각</th>
                  <th className="px-5 py-2.5 text-left">이벤트</th>
                  <th className="px-5 py-2.5 text-left">수신자</th>
                  <th className="px-5 py-2.5 text-left">제목</th>
                  <th className="px-5 py-2.5 text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3 text-zinc-600">
                      {dateTimeFormatter.format(new Date(l.createdAt))}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-700">{l.eventType}</td>
                    <td className="px-5 py-3 text-zinc-700">{l.recipientEmail}</td>
                    <td className="px-5 py-3 text-zinc-600">{l.subject}</td>
                    <td className="px-5 py-3 text-center">{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
