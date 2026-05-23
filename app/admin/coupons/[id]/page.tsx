import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCoupon } from "@/lib/coupons";
import { requirePermissionPage } from "@/lib/auth";
import { CouponForm } from "../coupon-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCouponEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:coupons");
  const { id } = await params;
  const coupon = getAdminCoupon(id);
  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 쿠폰 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">쿠폰 수정</h1>
        <p className="mt-1 text-xs text-zinc-500">
          사용 횟수: <span className="font-bold text-zinc-700">{coupon.usedCount}회</span>
        </p>
      </div>
      <CouponForm mode="edit" initial={coupon} />
    </div>
  );
}
