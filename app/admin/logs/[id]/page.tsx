import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminLog, LOG_ACTION_LABEL, LOG_TARGET_LABEL } from "@/lib/activity-log";
import { requirePermissionPage } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export default async function AdminLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("view:logs");
  const { id } = await params;
  const log = getAdminLog(id);
  if (!log) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/logs" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 활동 로그로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">활동 로그 상세</h1>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-black text-zinc-950">기본 정보</h2>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <Row label="시각" value={dateTimeFormatter.format(new Date(log.createdAt))} />
          <Row label="관리자" value={`${log.adminName} (${log.adminEmail})`} />
          <Row label="작업" value={LOG_ACTION_LABEL[log.actionType] ?? log.actionType} />
          <Row label="대상 유형" value={LOG_TARGET_LABEL[log.targetType] ?? log.targetType} />
          <Row label="대상 ID" value={log.targetId ?? "-"} />
          <Row label="대상명" value={log.targetName ?? "-"} />
          <Row label="IP 주소" value={log.ipAddress ?? "-"} />
          <Row
            label="User Agent"
            value={
              log.userAgent ? (
                <span className="break-all text-[11px] text-zinc-700">{log.userAgent}</span>
              ) : (
                "-"
              )
            }
          />
        </dl>
        <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm leading-6 text-zinc-700">
          {log.description}
        </p>
      </section>

      {log.beforeData || log.afterData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DataPanel title="변경 전" data={log.beforeData} />
          <DataPanel title="변경 후" data={log.afterData} />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-extrabold text-zinc-900">{value}</dd>
    </div>
  );
}

function DataPanel({ title, data }: { title: string; data: unknown }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black text-zinc-950">{title}</h3>
      <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-6 text-emerald-200">
        {data === null || data === undefined ? "-" : JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}
