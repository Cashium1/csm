import { randomUUID } from "node:crypto";
import { getDatabase } from "@/lib/db";

export type AdminLogEntry = {
  id: string;
  adminUserId: string | null;
  adminName: string;
  adminEmail: string;
  actionType: string;
  targetType: string;
  targetId: string | null;
  targetName: string | null;
  description: string;
  beforeData: unknown;
  afterData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type LogRow = {
  id: string;
  admin_user_id: string | null;
  admin_name: string;
  admin_email: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  description: string;
  before_data: string | null;
  after_data: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type AdminContext = {
  id: string;
  name: string;
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export function logAdminAction(input: {
  admin: AdminContext;
  actionType: string;
  targetType: string;
  targetId?: string | null;
  targetName?: string | null;
  description: string;
  beforeData?: unknown;
  afterData?: unknown;
}) {
  const now = new Date().toISOString();
  getDatabase()
    .prepare(
      `INSERT INTO admin_logs (
        id, admin_user_id, admin_name, admin_email,
        action_type, target_type, target_id, target_name, description,
        before_data, after_data, ip_address, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      randomUUID(),
      input.admin.id,
      input.admin.name,
      input.admin.email,
      input.actionType,
      input.targetType,
      input.targetId ?? null,
      input.targetName ?? null,
      input.description,
      input.beforeData !== undefined ? JSON.stringify(input.beforeData) : null,
      input.afterData !== undefined ? JSON.stringify(input.afterData) : null,
      input.admin.ipAddress ?? null,
      input.admin.userAgent ?? null,
      now,
    );
}

function rowToEntry(row: LogRow): AdminLogEntry {
  return {
    id: row.id,
    adminUserId: row.admin_user_id,
    adminName: row.admin_name,
    adminEmail: row.admin_email,
    actionType: row.action_type,
    targetType: row.target_type,
    targetId: row.target_id,
    targetName: row.target_name,
    description: row.description,
    beforeData: row.before_data ? safeJson(row.before_data) : null,
    afterData: row.after_data ? safeJson(row.after_data) : null,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export type LogFilter = {
  email?: string;
  actionType?: string;
  targetType?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
};

export function listAdminLogs(filter: LogFilter = {}, limit = 200): AdminLogEntry[] {
  const where: string[] = [];
  const params: Array<string | number> = [];
  if (filter.email) {
    where.push(`LOWER(admin_email) LIKE ?`);
    params.push(`%${filter.email.toLowerCase()}%`);
  }
  if (filter.actionType) {
    where.push(`action_type = ?`);
    params.push(filter.actionType);
  }
  if (filter.targetType) {
    where.push(`target_type = ?`);
    params.push(filter.targetType);
  }
  if (filter.from) {
    where.push(`substr(created_at, 1, 10) >= ?`);
    params.push(filter.from);
  }
  if (filter.to) {
    where.push(`substr(created_at, 1, 10) <= ?`);
    params.push(filter.to);
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const stmt = getDatabase().prepare(
    `SELECT * FROM admin_logs ${whereSql} ORDER BY created_at DESC LIMIT ?`,
  );
  const rows = stmt.all(...params, limit) as LogRow[];
  return rows.map(rowToEntry);
}

export function getAdminLog(id: string): AdminLogEntry | null {
  const row = getDatabase()
    .prepare(`SELECT * FROM admin_logs WHERE id = ?`)
    .get(id) as LogRow | undefined;
  return row ? rowToEntry(row) : null;
}

export const LOG_ACTION_LABEL: Record<string, string> = {
  create: "등록",
  update: "수정",
  delete: "삭제",
  publish: "공개",
  unpublish: "비공개",
  enable: "활성화",
  disable: "비활성화",
  refund_request: "환불 요청",
  refund_complete: "환불 완료",
  refund_execute: "환불 실행",
  status_change: "상태 변경",
  role_change: "권한 변경",
  answer: "답변",
};

export const LOG_TARGET_LABEL: Record<string, string> = {
  course: "강의",
  notice: "공지",
  inquiry: "문의",
  order: "결제",
  member: "회원",
  review: "리뷰",
  coupon: "쿠폰",
  setting: "사이트 설정",
  policy: "약관/정책",
  banner: "배너",
  faq: "FAQ",
  file: "파일",
  email_template: "이메일 템플릿",
  category: "카테고리",
};
