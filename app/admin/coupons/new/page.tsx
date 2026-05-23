import Link from "next/link";
import { requirePermissionPage } from "@/lib/auth";
import { CouponForm } from "../coupon-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCouponCreatePage() {
  await requirePermissionPage("manage:coupons");
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 쿠폰 관리로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">새 쿠폰 등록</h1>
      </div>
      <CouponForm mode="create" initial={null} />
    </div>
  );
}
