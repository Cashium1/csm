import { requirePermissionPage } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";
import { SettingsForm } from "./settings-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermissionPage("manage:settings");
  const settings = getSiteSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-950">사이트 설정</h1>
        <p className="mt-1 text-sm text-zinc-500">
          푸터, SEO 메타 정보, 고객센터, 사업자 정보 등 사이트 전체 설정을 관리합니다.
        </p>
      </div>
      <SettingsForm initial={settings} />
    </div>
  );
}
