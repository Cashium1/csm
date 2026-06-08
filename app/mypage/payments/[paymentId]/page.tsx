import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatWon } from "@/lib/format";
import { getPaymentDetail, type PaymentDetail } from "@/lib/payments";
import { PaymentStatusBadge } from "../payment-status-badge";
import { ReceiptActions, RefundRequestButton } from "./payment-detail-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaymentDetailPageProps = {
  params: Promise<{ paymentId: string }>;
};

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { paymentId } = await params;
  const payment = getPaymentDetail(user, paymentId);

  if (!payment) {
    return (
      <DetailShell>
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <p className="text-lg font-black text-zinc-950">결제 내역을 찾을 수 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            요청하신 결제 건이 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Link
            href="/mypage/payments"
            className="mt-6 inline-flex rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-extrabold text-zinc-950 transition hover:bg-[#f2c230]"
          >
            결제 내역으로 돌아가기
          </Link>
        </div>
      </DetailShell>
    );
  }

  const statementText = buildStatementText(payment);

  return (
    <DetailShell>
      <div className="mt-8 space-y-5">
        <DetailCard title="주문 정보">
          <InfoGrid>
            <InfoRow label="주문번호" value={payment.orderNumber} />
            <InfoRow label="결제번호" value={payment.paymentNumber} />
            <InfoRow label="결제일시" value={formatDateTime(payment.paidAt)} />
            <InfoRow label="결제 상태">
              <PaymentStatusBadge status={payment.status} />
            </InfoRow>
            <InfoRow label="구매자 이름" value={payment.buyerName} />
            <InfoRow label="구매자 이메일" value={payment.buyerEmail} />
          </InfoGrid>
        </DetailCard>

        <DetailCard title="상품 정보">
          <InfoGrid>
            <InfoRow label="상품명 / 강의명" value={payment.productName} />
            <InfoRow label="카테고리" value={payment.category} />
            <InfoRow label="상품 유형" value={payment.productType} />
            <InfoRow label="수강 상태" value={payment.courseStatus} />
            <InfoRow label="수강 가능 기간" value={payment.accessPeriod} />
          </InfoGrid>
          <div className="mt-5">
            <Link
              href={`/courses/${payment.courseSlug}`}
              className="inline-flex rounded-full bg-[#ffd84d] px-5 py-2.5 text-sm font-extrabold text-zinc-950 transition hover:bg-[#f2c230]"
            >
              수강하기
            </Link>
          </div>
        </DetailCard>

        <DetailCard title="결제 정보">
          <InfoGrid>
            <InfoRow label="상품 금액" value={formatWon(payment.originalPrice)} />
            <InfoRow
              label="할인 금액"
              value={payment.discountAmount > 0 ? `-${formatWon(payment.discountAmount)}` : formatWon(0)}
            />
            <InfoRow label="쿠폰명" value={payment.couponName ?? "사용한 쿠폰 없음"} />
            <InfoRow label="결제 수단" value={payment.paymentMethod} />
            <InfoRow label="카드사 / 간편결제사" value={payment.cardCompany ?? "—"} />
            <InfoRow label="승인번호" value={payment.approvalNumber} />
          </InfoGrid>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-[#fff9e6] px-4 py-3">
            <span className="text-sm font-extrabold text-zinc-700">최종 결제 금액</span>
            <span className="text-xl font-black text-[#b77900]">{formatWon(payment.finalPrice)}</span>
          </div>
        </DetailCard>

        <DetailCard title="환불 정보">
          {payment.refundStatus ? (
            <InfoGrid>
              <InfoRow label="환불 가능 여부" value={payment.refundable ? "가능" : "불가"} />
              <InfoRow label="환불 상태" value={payment.refundStatus} />
              <InfoRow
                label="환불 완료일"
                value={payment.refundCompletedAt ? formatDateTime(payment.refundCompletedAt) : "—"}
              />
              <InfoRow label="환불 사유" value={payment.refundReason ?? "—"} />
            </InfoGrid>
          ) : (
            <div>
              <p className="text-sm font-bold text-zinc-500">환불 내역이 없습니다.</p>
              {payment.refundable ? (
                <>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    이 결제 건은 환불 요청이 가능합니다.
                  </p>
                  <RefundRequestButton paymentId={payment.id} />
                </>
              ) : (
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  이 결제 건은 환불 가능 기간이 지났습니다.
                </p>
              )}
            </div>
          )}
        </DetailCard>

        <DetailCard title="영수증">
          <p className="text-sm leading-6 text-zinc-600">
            결제 영수증을 인쇄하거나 거래명세서를 파일로 저장할 수 있습니다.
          </p>
          <div className="mt-4">
            <ReceiptActions
              statementText={statementText}
              statementFileName={`거래명세서_${payment.orderNumber}.txt`}
            />
          </div>
        </DetailCard>
      </div>
    </DetailShell>
  );
}

function DetailShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-zinc-50 py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950">결제 상세 내역</h1>
        <Link
          href="/mypage/payments"
          className="mt-3 inline-flex items-center gap-1 text-sm font-extrabold text-zinc-500 transition hover:text-zinc-950"
        >
          ← 결제 내역으로 돌아가기
        </Link>
        {children}
      </div>
    </section>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>;
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-bold text-zinc-500">{label}</dt>
      <dd className="text-sm font-bold wrap-break-word text-zinc-900">{children ?? value}</dd>
    </div>
  );
}

function buildStatementText(payment: PaymentDetail): string {
  return [
    "캐쉬움(Cashoom) 거래명세서",
    "====================================",
    "",
    "[주문 정보]",
    `주문번호: ${payment.orderNumber}`,
    `결제번호: ${payment.paymentNumber}`,
    `결제일시: ${formatDateTime(payment.paidAt)}`,
    "결제 상태: 결제 완료",
    `구매자: ${payment.buyerName} (${payment.buyerEmail})`,
    "",
    "[상품 정보]",
    `상품명: ${payment.productName}`,
    `카테고리: ${payment.category}`,
    `상품 유형: ${payment.productType}`,
    "",
    "[결제 정보]",
    `상품 금액: ${formatWon(payment.originalPrice)}`,
    `할인 금액: -${formatWon(payment.discountAmount)}`,
    `쿠폰: ${payment.couponName ?? "사용 안 함"}`,
    `최종 결제 금액: ${formatWon(payment.finalPrice)}`,
    `결제 수단: ${payment.paymentMethod}${payment.cardCompany ? ` (${payment.cardCompany})` : ""}`,
    `승인번호: ${payment.approvalNumber}`,
    "",
    "본 명세서는 캐쉬움에서 발급한 거래 내역입니다.",
  ].join("\n");
}
