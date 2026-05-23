import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin";
import {
  getAdminMemberDetail,
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
} from "@/lib/admin-extra";
import { MemberStatusControl } from "./member-status-control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function formatWon(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}
function fmtDT(iso: string | null) {
  return iso ? dateTimeFormatter.format(new Date(iso)) : "-";
}
function fmtD(iso: string | null) {
  return iso ? dateFormatter.format(new Date(iso)) : "-";
}

function truncate(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = getAdminMemberDetail(id);
  if (!detail) {
    notFound();
  }

  const { base, purchases, orders, inquiries, reviews } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/members"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 회원 관리로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">{base.name}</h1>
          <p className="text-xs text-zinc-500">{base.email}</p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-black text-zinc-950">기본 정보</h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Row label="회원 ID" value={<span className="break-all font-mono text-xs">{base.id}</span>} />
            <Row label="이름" value={base.name} />
            <Row label="이메일" value={base.email} />
            <Row
              label="권한"
              value={
                base.role === "admin" ? (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                    ADMIN
                  </span>
                ) : (
                  "일반"
                )
              }
            />
            <Row
              label="계정 상태"
              value={
                base.status === "blocked"
                  ? "차단"
                  : base.status === "deleted"
                    ? "탈퇴"
                    : "활성"
              }
            />
            <Row label="가입일" value={fmtDT(base.createdAt)} />
            <Row label="최근 로그인" value={fmtDT(base.lastLoginAt)} />
          </dl>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black text-zinc-950">계정 상태 관리</h2>
          <p className="mt-2 text-xs text-zinc-500">
            차단 시 즉시 로그아웃되며 결제와 자료 접근이 막힙니다. 기존 구매/결제 데이터는 보존됩니다.
          </p>
          <MemberStatusControl userId={base.id} currentStatus={base.status} />
        </div>
      </section>

      <SectionCard title="구매한 강의" empty="구매한 강의가 없습니다." rows={purchases.length}>
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">강의명</th>
              <th className="px-5 py-2.5 text-left">구매일</th>
              <th className="px-5 py-2.5 text-right">결제 금액</th>
              <th className="px-5 py-2.5 text-center">수강 권한</th>
              <th className="px-5 py-2.5 text-center">결제 상태</th>
              <th className="px-5 py-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {purchases.map((p) => (
              <tr key={p.courseSlug}>
                <td className="px-5 py-3 font-extrabold text-zinc-900">{p.courseTitle}</td>
                <td className="px-5 py-3 text-zinc-600">{fmtD(p.purchasedAt)}</td>
                <td className="px-5 py-3 text-right font-bold text-zinc-900">
                  {formatWon(p.amount)}
                </td>
                <td className="px-5 py-3 text-center">
                  {p.accessStatus === "active" ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                      활성
                    </span>
                  ) : (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-black text-zinc-700">
                      비활성
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center text-zinc-700">
                  {ORDER_STATUS_LABELS[p.paymentStatus] ?? p.paymentStatus}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/courses/${p.courseSlug}`}
                    className="text-xs font-extrabold text-zinc-600 hover:text-zinc-950"
                  >
                    강의 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="결제 내역" empty="결제 내역이 없습니다." rows={orders.length}>
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">주문번호</th>
              <th className="px-5 py-2.5 text-left">강의명</th>
              <th className="px-5 py-2.5 text-right">금액</th>
              <th className="px-5 py-2.5 text-left">수단</th>
              <th className="px-5 py-2.5 text-center">상태</th>
              <th className="px-5 py-2.5 text-left">결제일</th>
              <th className="px-5 py-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="px-5 py-3 font-mono text-xs text-zinc-700">{o.id.slice(0, 18)}…</td>
                <td className="px-5 py-3 font-extrabold text-zinc-900">{o.orderName}</td>
                <td className="px-5 py-3 text-right font-bold text-zinc-900">
                  {formatWon(o.amount)}
                </td>
                <td className="px-5 py-3 text-zinc-600">{o.method || "-"}</td>
                <td className="px-5 py-3 text-center text-zinc-700">
                  {ORDER_STATUS_LABELS[o.status] ?? o.status}
                </td>
                <td className="px-5 py-3 text-zinc-600">
                  {fmtDT(o.approvedAt ?? o.createdAt)}
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/payments/${o.id}`}
                    className="text-xs font-extrabold text-zinc-600 hover:text-zinc-950"
                  >
                    결제 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="문의 내역" empty="문의 내역이 없습니다." rows={inquiries.length}>
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">제목</th>
              <th className="px-5 py-2.5 text-left">유형</th>
              <th className="px-5 py-2.5 text-center">상태</th>
              <th className="px-5 py-2.5 text-left">작성일</th>
              <th className="px-5 py-2.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {inquiries.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3 font-extrabold text-zinc-900">{i.title}</td>
                <td className="px-5 py-3 text-zinc-700">{INQUIRY_TYPE_LABEL[i.type] ?? i.type}</td>
                <td className="px-5 py-3 text-center text-zinc-700">
                  {INQUIRY_STATUS_LABEL[i.status]}
                </td>
                <td className="px-5 py-3 text-zinc-600">{fmtDT(i.createdAt)}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/inquiries/${i.id}`}
                    className="text-xs font-extrabold text-zinc-600 hover:text-zinc-950"
                  >
                    문의 →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      <SectionCard title="리뷰 작성 내역" empty="작성한 리뷰가 없습니다." rows={reviews.length}>
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-5 py-2.5 text-left">강의명</th>
              <th className="px-5 py-2.5 text-center">별점</th>
              <th className="px-5 py-2.5 text-left">내용</th>
              <th className="px-5 py-2.5 text-center">노출 상태</th>
              <th className="px-5 py-2.5 text-left">작성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-3 font-extrabold text-zinc-900">{r.courseTitle}</td>
                <td className="px-5 py-3 text-center text-amber-600">{"★".repeat(r.rating)}</td>
                <td className="px-5 py-3 text-zinc-600">{truncate(r.content)}</td>
                <td className="px-5 py-3 text-center">
                  {r.status === "hidden" ? (
                    <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-black text-zinc-700">
                      숨김
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                      노출
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-zinc-600">{fmtD(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
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

function SectionCard({
  title,
  empty,
  rows,
  children,
}: {
  title: string;
  empty: string;
  rows: number;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-black text-zinc-950">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        {rows === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-400">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
