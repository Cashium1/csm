import Link from "next/link";
import {
  listAdminLogs,
  LOG_ACTION_LABEL,
  LOG_TARGET_LABEL,
  type LogFilter,
} from "@/lib/activity-log";
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

const FILTER_INPUT_CLS =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#f2c230]";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    action?: string;
    target?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requirePermissionPage("view:logs");
  const params = await searchParams;
  const filter: LogFilter = {
    email: params.email,
    actionType: params.action,
    targetType: params.target,
    from: params.from,
    to: params.to,
  };
  const logs = listAdminLogs(filter, 200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">활동 로그</h1>
        <p className="mt-1 text-sm text-zinc-500">
          관리자가 수행한 작업 이력입니다. 로그는 삭제되지 않습니다.
        </p>
      </div>

      <form
        method="GET"
        className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="flex flex-col gap-1 text-xs font-bold text-zinc-600 lg:col-span-2">
          관리자 이메일
          <input
            name="email"
            defaultValue={params.email ?? ""}
            placeholder="email@example.com"
            className={FILTER_INPUT_CLS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-zinc-600">
          작업 유형
          <select name="action" defaultValue={params.action ?? ""} className={FILTER_INPUT_CLS}>
            <option value="">전체</option>
            {Object.entries(LOG_ACTION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-zinc-600">
          대상 유형
          <select name="target" defaultValue={params.target ?? ""} className={FILTER_INPUT_CLS}>
            <option value="">전체</option>
            {Object.entries(LOG_TARGET_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-zinc-600">
          시작일
          <input
            type="date"
            name="from"
            defaultValue={params.from ?? ""}
            className={FILTER_INPUT_CLS}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-zinc-600">
          종료일
          <input type="date" name="to" defaultValue={params.to ?? ""} className={FILTER_INPUT_CLS} />
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
          <button
            type="submit"
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-zinc-800"
          >
            필터 적용
          </button>
          <Link
            href="/admin/logs"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-extrabold text-zinc-700 transition hover:border-zinc-950"
          >
            초기화
          </Link>
          <span className="ml-auto text-xs text-zinc-500">최대 200건 표시</span>
        </div>
      </form>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 text-left">시각</th>
                <th className="px-5 py-3 text-left">관리자</th>
                <th className="px-5 py-3 text-left">작업</th>
                <th className="px-5 py-3 text-left">대상</th>
                <th className="px-5 py-3 text-left">설명</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-400">
                    조건에 맞는 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-zinc-50/60">
                    <td className="px-5 py-3 text-xs text-zinc-600">
                      {dateTimeFormatter.format(new Date(l.createdAt))}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-extrabold text-zinc-900">{l.adminName}</p>
                      <p className="text-xs text-zinc-500">{l.adminEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-700">
                      {LOG_ACTION_LABEL[l.actionType] ?? l.actionType}
                    </td>
                    <td className="px-5 py-3 text-zinc-700">
                      {LOG_TARGET_LABEL[l.targetType] ?? l.targetType}
                      {l.targetName ? (
                        <p className="text-xs text-zinc-500">{l.targetName}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{l.description}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/logs/${l.id}`}
                        className="text-xs font-extrabold text-zinc-600 hover:text-zinc-950"
                      >
                        상세 →
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
