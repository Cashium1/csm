import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 콘솔 | 캐쉬움",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // 관리자가 아니면 redirect로 차단됩니다. (서버에서 강제)
  const user = await requireAdmin();
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
