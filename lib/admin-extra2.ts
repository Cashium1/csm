import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";

// ============================================================================
// Banners
// ============================================================================

export type Banner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  position: string;
  displayOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type BannerRow = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  position: string;
  display_order: number;
  is_published: number;
  created_at: string;
  updated_at: string;
};

function rowToBanner(row: BannerRow): Banner {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    buttonText: row.button_text,
    buttonLink: row.button_link,
    position: row.position,
    displayOrder: row.display_order,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type BannerInput = Omit<Banner, "id" | "createdAt" | "updatedAt">;

export function listAdminBanners(): Banner[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM banners ORDER BY position, display_order, created_at DESC`)
    .all() as BannerRow[];
  return rows.map(rowToBanner);
}

export function listPublicBanners(position = "main"): Banner[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM banners WHERE is_published = 1 AND position = ?
       ORDER BY display_order, created_at DESC`,
    )
    .all(position) as BannerRow[];
  return rows.map(rowToBanner);
}

export function getAdminBanner(id: string): Banner | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM banners WHERE id = ?`)
    .get(id) as BannerRow | undefined;
  return row ? rowToBanner(row) : null;
}

export function createBanner(input: BannerInput) {
  if (!input.title.trim()) return { ok: false as const, message: "제목을 입력해 주세요." };
  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO banners (id, title, description, image_url, button_text, button_link,
       position, display_order, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.title.trim(),
      input.description,
      input.imageUrl,
      input.buttonText,
      input.buttonLink,
      input.position || "main",
      input.displayOrder,
      input.isPublished ? 1 : 0,
      now,
      now,
    );
  return { ok: true as const, id };
}

export function updateBanner(id: string, input: BannerInput) {
  const existing = getAdminBanner(id);
  if (!existing) return { ok: false as const, message: "배너를 찾을 수 없습니다." };
  getDatabase()
    .prepare(
      `UPDATE banners SET title = ?, description = ?, image_url = ?, button_text = ?,
       button_link = ?, position = ?, display_order = ?, is_published = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.title.trim(),
      input.description,
      input.imageUrl,
      input.buttonText,
      input.buttonLink,
      input.position || "main",
      input.displayOrder,
      input.isPublished ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  return { ok: true as const };
}

export function deleteBanner(id: string) {
  getDatabase().prepare(`DELETE FROM banners WHERE id = ?`).run(id);
  return { ok: true as const };
}

// ============================================================================
// FAQs
// ============================================================================

export { FAQ_CATEGORIES } from "@/lib/admin-constants";

export type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

type FaqRow = {
  id: string;
  category: string;
  question: string;
  answer: string;
  is_published: number;
  display_order: number;
  created_at: string;
  updated_at: string;
};

function rowToFaq(row: FaqRow): Faq {
  return {
    id: row.id,
    category: row.category,
    question: row.question,
    answer: row.answer,
    isPublished: row.is_published === 1,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FaqInput = Omit<Faq, "id" | "createdAt" | "updatedAt">;

export function listAdminFaqs(): Faq[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM faqs ORDER BY category, display_order, created_at DESC`)
    .all() as FaqRow[];
  return rows.map(rowToFaq);
}

export function listPublicFaqs(): Faq[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM faqs WHERE is_published = 1
       ORDER BY category, display_order, created_at DESC`,
    )
    .all() as FaqRow[];
  return rows.map(rowToFaq);
}

export function getAdminFaq(id: string): Faq | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM faqs WHERE id = ?`)
    .get(id) as FaqRow | undefined;
  return row ? rowToFaq(row) : null;
}

export function createFaq(input: FaqInput) {
  if (!input.question.trim()) return { ok: false as const, message: "질문을 입력해 주세요." };
  if (!input.answer.trim()) return { ok: false as const, message: "답변을 입력해 주세요." };
  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO faqs (id, category, question, answer, is_published, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.category || "기타",
      input.question.trim(),
      input.answer.trim(),
      input.isPublished ? 1 : 0,
      input.displayOrder,
      now,
      now,
    );
  return { ok: true as const, id };
}

export function updateFaq(id: string, input: FaqInput) {
  const existing = getAdminFaq(id);
  if (!existing) return { ok: false as const, message: "FAQ를 찾을 수 없습니다." };
  getDatabase()
    .prepare(
      `UPDATE faqs SET category = ?, question = ?, answer = ?,
       is_published = ?, display_order = ?, updated_at = ? WHERE id = ?`,
    )
    .run(
      input.category || "기타",
      input.question.trim(),
      input.answer.trim(),
      input.isPublished ? 1 : 0,
      input.displayOrder,
      new Date().toISOString(),
      id,
    );
  return { ok: true as const };
}

export function deleteFaq(id: string) {
  getDatabase().prepare(`DELETE FROM faqs WHERE id = ?`).run(id);
  return { ok: true as const };
}

// ============================================================================
// Policies (버전 관리)
// ============================================================================

export { POLICY_TYPES, POLICY_TYPE_LABEL } from "@/lib/admin-constants";

export type Policy = {
  id: string;
  policyType: string;
  title: string;
  content: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type PolicyRow = {
  id: string;
  policy_type: string;
  title: string;
  content: string;
  version: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function rowToPolicy(row: PolicyRow): Policy {
  return {
    id: row.id,
    policyType: row.policy_type,
    title: row.title,
    content: row.content,
    version: row.version,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listAdminPolicies(): Policy[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM policies ORDER BY policy_type, version DESC, created_at DESC`)
    .all() as PolicyRow[];
  return rows.map(rowToPolicy);
}

export function getAdminPolicy(id: string): Policy | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM policies WHERE id = ?`)
    .get(id) as PolicyRow | undefined;
  return row ? rowToPolicy(row) : null;
}

export function getActivePolicy(policyType: string): Policy | null {
  const row = getDatabase()
    .prepare(
      `SELECT * FROM policies WHERE policy_type = ? AND is_active = 1
       ORDER BY version DESC LIMIT 1`,
    )
    .get(policyType) as PolicyRow | undefined;
  return row ? rowToPolicy(row) : null;
}

// 새 버전을 생성합니다. (기존을 덮어쓰지 않음)
export function createPolicyVersion(
  policyType: string,
  input: { title: string; content: string; setActive: boolean },
) {
  if (!input.title.trim()) return { ok: false as const, message: "제목을 입력해 주세요." };
  if (!input.content.trim()) return { ok: false as const, message: "내용을 입력해 주세요." };

  const db = getDatabase();
  const maxVersion = (
    db
      .prepare(`SELECT COALESCE(MAX(version), 0) AS v FROM policies WHERE policy_type = ?`)
      .get(policyType) as { v: number }
  ).v;
  const newVersion = maxVersion + 1;

  const id = randomUUID();
  const now = new Date().toISOString();

  if (input.setActive) {
    db
      .prepare(`UPDATE policies SET is_active = 0, updated_at = ? WHERE policy_type = ?`)
      .run(now, policyType);
  }

  db
    .prepare(
      `INSERT INTO policies (id, policy_type, title, content, version, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      policyType,
      input.title.trim(),
      input.content.trim(),
      newVersion,
      input.setActive ? 1 : 0,
      now,
      now,
    );

  return { ok: true as const, id, version: newVersion };
}

export function activatePolicy(id: string) {
  const policy = getAdminPolicy(id);
  if (!policy) return { ok: false as const, message: "정책 문서를 찾을 수 없습니다." };
  const now = new Date().toISOString();
  const db = getDatabase();
  db
    .prepare(`UPDATE policies SET is_active = 0, updated_at = ? WHERE policy_type = ?`)
    .run(now, policy.policyType);
  db
    .prepare(`UPDATE policies SET is_active = 1, updated_at = ? WHERE id = ?`)
    .run(now, id);
  return { ok: true as const };
}

// ============================================================================
// Files (자료 관리)
// ============================================================================

export { FILE_TYPES, FILE_TYPE_LABEL } from "@/lib/admin-constants";

export type FileEntry = {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number | null;
  relatedCourseId: string | null;
  relatedCourseTitle: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FileRow = {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  related_course_id: string | null;
  related_course_title: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function rowToFile(row: FileRow): FileEntry {
  return {
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_type,
    fileUrl: row.file_url,
    fileSize: row.file_size,
    relatedCourseId: row.related_course_id,
    relatedCourseTitle: row.related_course_title,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FileInput = Omit<FileEntry, "id" | "createdAt" | "updatedAt">;

export function listAdminFiles(): FileEntry[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM files ORDER BY created_at DESC`)
    .all() as FileRow[];
  return rows.map(rowToFile);
}

export function getAdminFile(id: string): FileEntry | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM files WHERE id = ?`)
    .get(id) as FileRow | undefined;
  return row ? rowToFile(row) : null;
}

export function createFile(input: FileInput) {
  if (!input.fileName.trim()) return { ok: false as const, message: "파일명을 입력해 주세요." };
  if (!input.fileUrl.trim()) return { ok: false as const, message: "파일 URL을 입력해 주세요." };
  const id = randomUUID();
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO files (id, file_name, file_type, file_url, file_size,
       related_course_id, related_course_title, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.fileName.trim(),
      input.fileType || "pdf",
      input.fileUrl.trim(),
      input.fileSize,
      input.relatedCourseId,
      input.relatedCourseTitle,
      input.isActive ? 1 : 0,
      now,
      now,
    );
  return { ok: true as const, id };
}

export function updateFile(id: string, input: FileInput) {
  const existing = getAdminFile(id);
  if (!existing) return { ok: false as const, message: "파일을 찾을 수 없습니다." };
  getDatabase()
    .prepare(
      `UPDATE files SET file_name = ?, file_type = ?, file_url = ?, file_size = ?,
       related_course_id = ?, related_course_title = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.fileName.trim(),
      input.fileType,
      input.fileUrl.trim(),
      input.fileSize,
      input.relatedCourseId,
      input.relatedCourseTitle,
      input.isActive ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  return { ok: true as const };
}

export function deactivateFile(id: string) {
  getDatabase()
    .prepare(`UPDATE files SET is_active = 0, updated_at = ? WHERE id = ?`)
    .run(new Date().toISOString(), id);
  return { ok: true as const };
}

// ============================================================================
// Email templates
// ============================================================================

export type EmailTemplate = {
  id: string;
  eventType: string;
  templateName: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type EmailTemplateRow = {
  id: string;
  event_type: string;
  template_name: string;
  subject: string;
  body: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

function rowToEmailTemplate(row: EmailTemplateRow): EmailTemplate {
  return {
    id: row.id,
    eventType: row.event_type,
    templateName: row.template_name,
    subject: row.subject,
    body: row.body,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listEmailTemplates(): EmailTemplate[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM email_templates ORDER BY event_type`)
    .all() as EmailTemplateRow[];
  return rows.map(rowToEmailTemplate);
}

export function getEmailTemplate(id: string): EmailTemplate | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM email_templates WHERE id = ?`)
    .get(id) as EmailTemplateRow | undefined;
  return row ? rowToEmailTemplate(row) : null;
}

export function updateEmailTemplate(
  id: string,
  input: { templateName: string; subject: string; body: string; isActive: boolean },
) {
  const existing = getEmailTemplate(id);
  if (!existing) return { ok: false as const, message: "템플릿을 찾을 수 없습니다." };
  getDatabase()
    .prepare(
      `UPDATE email_templates SET template_name = ?, subject = ?, body = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.templateName.trim(),
      input.subject.trim(),
      input.body,
      input.isActive ? 1 : 0,
      new Date().toISOString(),
      id,
    );
  return { ok: true as const };
}

export type EmailLog = {
  id: string;
  eventType: string;
  recipientEmail: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

type EmailLogRow = {
  id: string;
  event_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export function listEmailLogs(limit = 100): EmailLog[] {
  const rows = getDatabase()
    .prepare(`SELECT * FROM email_logs ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as EmailLogRow[];
  return rows.map((r) => ({
    id: r.id,
    eventType: r.event_type,
    recipientEmail: r.recipient_email,
    subject: r.subject,
    status: r.status,
    errorMessage: r.error_message,
    sentAt: r.sent_at,
    createdAt: r.created_at,
  }));
}
