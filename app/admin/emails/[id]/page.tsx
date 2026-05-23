import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmailTemplate } from "@/lib/admin-extra2";
import { requirePermissionPage } from "@/lib/auth";
import { EmailTemplateForm } from "./email-template-form";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminEmailEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("manage:email_templates");
  const { id } = await params;
  const template = getEmailTemplate(id);
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/emails" className="text-xs font-extrabold text-zinc-500 hover:text-zinc-950">
          ← 이메일 템플릿으로
        </Link>
        <h1 className="mt-1 text-2xl font-black text-zinc-950">{template.templateName}</h1>
        <p className="mt-1 text-xs text-zinc-500">
          이벤트 키: <span className="font-mono">{template.eventType}</span>
        </p>
      </div>
      <EmailTemplateForm initial={template} />
    </div>
  );
}
