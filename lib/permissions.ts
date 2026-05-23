// 관리자 권한 세분화: 5단계 admin role + 권한 매트릭스

export type AdminRole =
  | "super_admin"
  | "admin"
  | "content_manager"
  | "support_manager"
  | "finance_manager";

export type AppRole = "user" | AdminRole;

export const ADMIN_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "content_manager",
  "support_manager",
  "finance_manager",
];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  super_admin: "최고관리자",
  admin: "관리자",
  content_manager: "콘텐츠 매니저",
  support_manager: "고객지원 매니저",
  finance_manager: "재무 매니저",
};

// 사용 가능한 permission 키 (메뉴/리소스 단위)
export type Permission =
  | "view:dashboard"
  | "view:stats"
  | "view:logs"
  | "view:members"
  | "view:reviews"
  | "manage:courses"
  | "manage:categories"
  | "manage:notices"
  | "manage:reviews"
  | "manage:faqs"
  | "manage:banners"
  | "manage:files"
  | "manage:inquiries"
  | "manage:members_status"
  | "manage:admin_roles"
  | "manage:payments"
  | "manage:refunds"
  | "manage:coupons"
  | "manage:settings"
  | "manage:policies"
  | "manage:email_templates";

const ADMIN_BASE_PERMISSIONS: Permission[] = [
  "view:dashboard",
  "view:stats",
  "view:logs",
  "view:members",
  "view:reviews",
  "manage:courses",
  "manage:categories",
  "manage:notices",
  "manage:reviews",
  "manage:faqs",
  "manage:banners",
  "manage:files",
  "manage:inquiries",
  "manage:members_status",
  "manage:payments",
  "manage:refunds",
  "manage:coupons",
  "manage:settings",
  "manage:policies",
  "manage:email_templates",
];

const PERMISSIONS_BY_ROLE: Record<AdminRole, Permission[]> = {
  super_admin: [...ADMIN_BASE_PERMISSIONS, "manage:admin_roles"],
  admin: ADMIN_BASE_PERMISSIONS,
  content_manager: [
    "view:dashboard",
    "view:reviews",
    "manage:courses",
    "manage:categories",
    "manage:notices",
    "manage:reviews",
    "manage:faqs",
    "manage:banners",
    "manage:files",
  ],
  support_manager: [
    "view:dashboard",
    "view:members",
    "view:reviews",
    "manage:inquiries",
  ],
  finance_manager: [
    "view:dashboard",
    "view:stats",
    "view:members",
    "manage:payments",
    "manage:refunds",
    "manage:coupons",
  ],
};

export function isAdminRole(role: string | undefined | null): role is AdminRole {
  return Boolean(role) && (ADMIN_ROLES as string[]).includes(role as string);
}

export function hasPermission(
  role: string | undefined | null,
  permission: Permission,
): boolean {
  if (!role || !isAdminRole(role)) return false;
  return PERMISSIONS_BY_ROLE[role].includes(permission);
}

export function listPermissions(role: AdminRole): Permission[] {
  return PERMISSIONS_BY_ROLE[role];
}
