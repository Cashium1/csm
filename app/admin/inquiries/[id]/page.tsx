import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdminInquiry,
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
} from "@/lib/admin-extra";
import { AnswerForm } from "./answer-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return dateTimeFormatter.format(new Date(iso));
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = getAdminInquiry(id);
  if (!inquiry) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/inquiries"
          className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950"
        >
          ← 문의 관리로
        </Link>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-black text-zinc-950">{inquiry.title}</h1>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
              inquiry.status === "answered"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {INQUIRY_STATUS_LABEL[inquiry.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-black text-zinc-950">문의 내용</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
            {inquiry.content}
          </p>
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-black text-zinc-950">문의자</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="이름" value={inquiry.userName} />
              <Row label="이메일" value={inquiry.userEmail} />
              <Row label="유형" value={INQUIRY_TYPE_LABEL[inquiry.type] ?? inquiry.type} />
              <Row label="작성일" value={formatDateTime(inquiry.createdAt)} />
            </dl>
          </div>

          {inquiry.relatedCourseTitle || inquiry.relatedOrderId ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-black text-zinc-950">관련 정보</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {inquiry.relatedCourseTitle ? (
                  <Row
                    label="강의"
                    value={
                      inquiry.relatedCourseId ? (
                        <Link
                          href={`/admin/courses/${inquiry.relatedCourseId}`}
                          className="font-extrabold text-zinc-900 hover:underline"
                        >
                          {inquiry.relatedCourseTitle}
                        </Link>
                      ) : (
                        inquiry.relatedCourseTitle
                      )
                    }
                  />
                ) : null}
                {inquiry.relatedOrderId ? (
                  <Row
                    label="주문번호"
                    value={
                      <Link
                        href={`/admin/payments/${inquiry.relatedOrderId}`}
                        className="break-all font-mono text-xs text-zinc-700 hover:underline"
                      >
                        {inquiry.relatedOrderId}
                      </Link>
                    }
                  />
                ) : null}
              </dl>
            </div>
          ) : null}
        </aside>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-zinc-950">관리자 답변</h2>
          {inquiry.answeredAt ? (
            <p className="text-xs text-zinc-500">
              답변일 {formatDateTime(inquiry.answeredAt)} · {inquiry.answeredBy ?? "-"}
            </p>
          ) : null}
        </div>
        <AnswerForm inquiryId={inquiry.id} initialAnswer={inquiry.answer ?? ""} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="text-right font-bold text-zinc-800">{value}</dd>
    </div>
  );
}
