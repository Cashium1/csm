import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { notices as defaultNotices } from "@/lib/data";

// 데이터 디렉터리는 DATA_DIR 환경변수로 바꿀 수 있습니다.
// (영속 볼륨이 있는 서버에 배포할 때 마운트 경로를 지정하기 위함. 미설정 시 ./data)
const databaseDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
const databasePath = path.join(databaseDir, "cashoom.sqlite");

type GlobalWithDatabase = typeof globalThis & {
  __cashoomDatabase?: DatabaseSync;
  // 스키마 초기화/마이그레이션/시드가 이 연결에서 이미 수행됐는지 표시합니다.
  __cashoomDatabaseReady?: boolean;
};

export function getDatabase() {
  const globalForDatabase = globalThis as GlobalWithDatabase;

  if (!globalForDatabase.__cashoomDatabase) {
    mkdirSync(databaseDir, { recursive: true });

    const database = new DatabaseSync(databasePath);
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec("PRAGMA journal_mode = WAL;");

    globalForDatabase.__cashoomDatabase = database;
    globalForDatabase.__cashoomDatabaseReady = false;
  }

  const database = globalForDatabase.__cashoomDatabase;

  // 초기화/마이그레이션/시드는 연결당 1회만 수행합니다.
  // (getDatabase는 요청마다 여러 번 호출되므로 매번 재실행하면 불필요한 부하가 큽니다.)
  if (!globalForDatabase.__cashoomDatabaseReady) {
    initializeSchema(database);
    migrateSchema(database);
    seedDatabase(database);
    globalForDatabase.__cashoomDatabaseReady = true;
  }

  return database;
}

function initializeSchema(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS "USER" (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      purchased_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      enrolled_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS courses (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      group_key TEXT NOT NULL,
      summary TEXT NOT NULL,
      level TEXT NOT NULL,
      duration TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      price TEXT NOT NULL,
      price_number INTEGER NOT NULL,
      thumbnail TEXT NOT NULL,
      material_pdf TEXT NOT NULL,
      badge TEXT NOT NULL,
      card_category TEXT NOT NULL,
      original_price TEXT NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_cart_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
      FOREIGN KEY (course_slug) REFERENCES courses(slug) ON DELETE CASCADE,
      UNIQUE(user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS course_completions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
      FOREIGN KEY (course_slug) REFERENCES courses(slug) ON DELETE CASCADE,
      UNIQUE(user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS course_reviews (
      id TEXT PRIMARY KEY,
      course_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_slug)
    );

    CREATE TABLE IF NOT EXISTS email_verifications (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course_slug TEXT NOT NULL,
      order_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_key TEXT,
      method TEXT,
      receipt_url TEXT,
      approved_at TEXT,
      fail_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      related_course_id TEXT,
      related_course_title TEXT,
      related_order_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      answer TEXT,
      answered_at TEXT,
      answered_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      site_name TEXT NOT NULL DEFAULT '캐쉬움',
      site_description TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_service_hours TEXT NOT NULL DEFAULT '',
      company_name TEXT NOT NULL DEFAULT '',
      representative_name TEXT NOT NULL DEFAULT '',
      business_number TEXT NOT NULL DEFAULT '',
      ecommerce_registration_number TEXT NOT NULL DEFAULT '',
      business_address TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      footer_copyright TEXT NOT NULL DEFAULT '',
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      meta_keywords TEXT NOT NULL DEFAULT '',
      og_image_url TEXT NOT NULL DEFAULT '',
      favicon_url TEXT NOT NULL DEFAULT '',
      terms_url TEXT NOT NULL DEFAULT '/terms',
      privacy_url TEXT NOT NULL DEFAULT '/privacy',
      refund_policy_url TEXT NOT NULL DEFAULT '/refund-policy',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      button_text TEXT NOT NULL DEFAULT '',
      button_link TEXT NOT NULL DEFAULT '',
      position TEXT NOT NULL DEFAULT 'main',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value INTEGER NOT NULL DEFAULT 0,
      max_discount_amount INTEGER,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      applies_to_all_courses INTEGER NOT NULL DEFAULT 1,
      applicable_course_ids TEXT NOT NULL DEFAULT '',
      applicable_category_ids TEXT NOT NULL DEFAULT '',
      usage_limit INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      user_limit INTEGER NOT NULL DEFAULT 1,
      starts_at TEXT,
      ends_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupon_usages (
      id TEXT PRIMARY KEY,
      coupon_id TEXT NOT NULL,
      coupon_code TEXT NOT NULL,
      user_id TEXT NOT NULL,
      course_id TEXT,
      order_id TEXT,
      discount_amount INTEGER NOT NULL,
      used_at TEXT NOT NULL,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES "USER"(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id TEXT PRIMARY KEY,
      admin_user_id TEXT,
      admin_name TEXT NOT NULL,
      admin_email TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      target_name TEXT,
      description TEXT NOT NULL,
      before_data TEXT,
      after_data TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL UNIQUE,
      template_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL DEFAULT '기타',
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      policy_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'pdf',
      file_url TEXT NOT NULL,
      file_size INTEGER,
      related_course_id TEXT,
      related_course_title TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash
      ON user_sessions(token_hash);

    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
      ON user_sessions(user_id);

    CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id
      ON course_purchases(user_id);

    CREATE INDEX IF NOT EXISTS idx_course_purchases_course_slug
      ON course_purchases(course_slug);

    CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id
      ON course_enrollments(user_id);

    CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_slug
      ON course_enrollments(course_slug);

    CREATE INDEX IF NOT EXISTS idx_courses_group_key
      ON courses(group_key);

    CREATE INDEX IF NOT EXISTS idx_course_cart_items_user_id
      ON course_cart_items(user_id);

    CREATE INDEX IF NOT EXISTS idx_course_cart_items_course_slug
      ON course_cart_items(course_slug);

    CREATE INDEX IF NOT EXISTS idx_course_completions_user_id
      ON course_completions(user_id);

    CREATE INDEX IF NOT EXISTS idx_course_completions_course_slug
      ON course_completions(course_slug);

    CREATE INDEX IF NOT EXISTS idx_course_reviews_course_slug
      ON course_reviews(course_slug);

    CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id
      ON course_reviews(user_id);

    CREATE INDEX IF NOT EXISTS idx_email_verifications_email
      ON email_verifications(email);

    CREATE INDEX IF NOT EXISTS idx_orders_user_id
      ON orders(user_id);

    CREATE INDEX IF NOT EXISTS idx_inquiries_status
      ON inquiries(status, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_inquiries_user_id
      ON inquiries(user_id);

    CREATE INDEX IF NOT EXISTS idx_banners_position
      ON banners(position, display_order);

    CREATE INDEX IF NOT EXISTS idx_coupons_status
      ON coupons(status, ends_at);

    CREATE INDEX IF NOT EXISTS idx_coupon_usages_user
      ON coupon_usages(user_id, coupon_id);

    CREATE INDEX IF NOT EXISTS idx_admin_logs_created
      ON admin_logs(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_admin_logs_target
      ON admin_logs(target_type, target_id);

    CREATE INDEX IF NOT EXISTS idx_email_logs_created
      ON email_logs(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_faqs_published
      ON faqs(is_published, display_order);

    CREATE INDEX IF NOT EXISTS idx_policies_active
      ON policies(policy_type, is_active);

    CREATE INDEX IF NOT EXISTS idx_files_active
      ON files(is_active, file_type);
  `);
}

// 기존 DB에 새 컬럼을 추가합니다. (CREATE TABLE IF NOT EXISTS로는 컬럼 추가가 안 되므로 분리)
function migrateSchema(database: DatabaseSync) {
  const ensureColumn = (table: string, column: string, def: string) => {
    const rows = database
      .prepare(`PRAGMA table_info("${table}")`)
      .all() as Array<{ name: string }>;
    if (!rows.some((r) => r.name === column)) {
      database.exec(`ALTER TABLE "${table}" ADD COLUMN ${column} ${def}`);
    }
  };

  // USER: 운영자 권한 / 상태
  ensureColumn("USER", "role", "TEXT NOT NULL DEFAULT 'user'");
  ensureColumn("USER", "status", "TEXT NOT NULL DEFAULT 'active'");

  // courses: 관리자 편집 필드
  ensureColumn("courses", "description", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("courses", "discount_price", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("courses", "recommended_for", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("courses", "outcomes", "TEXT NOT NULL DEFAULT ''");
  ensureColumn("courses", "is_published", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn("courses", "is_on_sale", "INTEGER NOT NULL DEFAULT 1");

  // 2차 관리자 기능을 위한 컬럼들
  ensureColumn("USER", "last_login_at", "TEXT");

  ensureColumn("orders", "refund_status", "TEXT NOT NULL DEFAULT 'none'");
  ensureColumn("orders", "refund_reason", "TEXT");
  ensureColumn("orders", "refund_amount", "INTEGER");
  ensureColumn("orders", "refund_requested_at", "TEXT");
  ensureColumn("orders", "refunded_at", "TEXT");
  ensureColumn("orders", "admin_memo", "TEXT");

  // 결제내역에 실제 할인/쿠폰 정보를 표시하기 위한 컬럼들
  // original_amount: 할인 전 금액, amount: 실제 결제(할인 적용) 금액
  ensureColumn("orders", "original_amount", "INTEGER");
  ensureColumn("orders", "discount_amount", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("orders", "coupon_id", "TEXT");
  ensureColumn("orders", "coupon_code", "TEXT");

  ensureColumn("course_purchases", "access_status", "TEXT NOT NULL DEFAULT 'active'");
  ensureColumn("course_purchases", "access_granted_at", "TEXT");
  ensureColumn("course_purchases", "access_revoked_at", "TEXT");
  ensureColumn("course_purchases", "revoked_reason", "TEXT");

  ensureColumn("course_reviews", "status", "TEXT NOT NULL DEFAULT 'visible'");
}

// 시드/멱등 초기화: 관리자 승격 + 공지 기본값
function seedDatabase(database: DatabaseSync) {
  // ADMIN_EMAILS 환경변수에 적힌 이메일을 관리자로 자동 승격합니다. (멱등)
  const adminEnv = process.env.ADMIN_EMAILS;
  if (adminEnv) {
    const emails = adminEnv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (emails.length > 0) {
      const stmt = database.prepare(
        `UPDATE "USER" SET role = 'admin' WHERE LOWER(email) = ? AND role != 'admin'`,
      );
      for (const email of emails) {
        stmt.run(email);
      }
    }
  }

  // 사이트 설정 단일 행이 없으면 생성
  const settingsCount = database
    .prepare(`SELECT count(*) AS c FROM site_settings`)
    .get() as { c: number };
  if (settingsCount.c === 0) {
    const now = new Date().toISOString();
    database
      .prepare(
        `INSERT INTO site_settings (
          id, site_name, site_description, customer_email, customer_service_hours,
          company_name, footer_copyright, meta_title, meta_description,
          created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "캐쉬움",
        "사용자 맞춤형 부업 추천 및 학습 플랫폼",
        "support@cashoom.example.com",
        "평일 10:00 - 18:00 (점심 12:00 - 13:00)",
        "캐쉬움",
        "© 2026 캐쉬움. All rights reserved.",
        "캐쉬움 | 사용자 맞춤형 부업 추천 및 학습 플랫폼",
        "나에게 맞는 부업 카테고리를 추천받고, 수익 구조와 시작 방법을 짧고 명확하게 학습하세요.",
        now,
        now,
      );
  }

  // 이메일 템플릿 기본값 시드
  const emailTemplateCount = database
    .prepare(`SELECT count(*) AS c FROM email_templates`)
    .get() as { c: number };
  if (emailTemplateCount.c === 0) {
    const now = new Date().toISOString();
    const insert = database.prepare(
      `INSERT INTO email_templates (id, event_type, template_name, subject, body, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    );
    const defaults: Array<{ event: string; name: string; subject: string; body: string }> = [
      {
        event: "signup_completed",
        name: "회원가입 완료",
        subject: "[캐쉬움] 회원가입을 환영합니다",
        body: "{{userName}}님, 캐쉬움 회원가입을 환영합니다.\n\n지금 바로 추천 설문에 참여해 보세요.",
      },
      {
        event: "payment_completed",
        name: "결제 완료",
        subject: "[캐쉬움] {{courseTitle}} 결제가 완료되었습니다",
        body: "{{userName}}님, {{courseTitle}} 결제가 완료되었습니다.\n주문번호: {{orderId}}\n결제 금액: {{amount}}원",
      },
      {
        event: "payment_failed",
        name: "결제 실패",
        subject: "[캐쉬움] 결제가 정상 처리되지 않았습니다",
        body: "{{userName}}님, 주문 {{orderId}} 결제가 실패했습니다. 다시 시도해 주세요.",
      },
      {
        event: "refund_requested",
        name: "환불 요청 접수",
        subject: "[캐쉬움] 환불 요청이 접수되었습니다",
        body: "{{userName}}님의 {{courseTitle}} 환불 요청을 접수했습니다.\n주문번호: {{orderId}}",
      },
      {
        event: "refund_completed",
        name: "환불 완료",
        subject: "[캐쉬움] 환불이 완료되었습니다",
        body: "{{userName}}님, {{courseTitle}}의 환불이 완료되었습니다.\n환불 금액: {{amount}}원",
      },
      {
        event: "inquiry_answered",
        name: "문의 답변 완료",
        subject: "[캐쉬움] 문의에 대한 답변이 등록되었습니다",
        body: "{{userName}}님, 문의하신 \"{{inquiryTitle}}\"에 대한 답변이 등록되었습니다.\n\n{{answer}}",
      },
      {
        event: "course_purchased",
        name: "강의 구매 완료",
        subject: "[캐쉬움] {{courseTitle}} 수강이 시작됩니다",
        body: "{{userName}}님, {{courseTitle}} 수강을 시작할 수 있습니다.",
      },
      {
        event: "admin_new_payment",
        name: "[관리자] 새 결제 발생",
        subject: "[캐쉬움 관리자] 새 결제: {{courseTitle}}",
        body: "{{userName}}님이 {{courseTitle}}을(를) 결제했습니다. 주문번호: {{orderId}}, 금액: {{amount}}원",
      },
      {
        event: "admin_new_inquiry",
        name: "[관리자] 새 문의 접수",
        subject: "[캐쉬움 관리자] 새 문의: {{inquiryTitle}}",
        body: "새 문의가 접수되었습니다.\n제목: {{inquiryTitle}}\n작성자: {{userName}}",
      },
      {
        event: "admin_new_refund",
        name: "[관리자] 환불 요청 발생",
        subject: "[캐쉬움 관리자] 환불 요청: {{orderId}}",
        body: "{{userName}}님이 {{courseTitle}} 환불을 요청했습니다.",
      },
      {
        event: "admin_new_signup",
        name: "[관리자] 신규 회원 가입",
        subject: "[캐쉬움 관리자] 신규 회원: {{userName}}",
        body: "신규 회원이 가입했습니다.\n이름: {{userName}}",
      },
      {
        event: "admin_new_review",
        name: "[관리자] 새 리뷰 등록",
        subject: "[캐쉬움 관리자] 새 리뷰: {{courseTitle}}",
        body: "{{userName}}님이 {{courseTitle}}에 리뷰를 남겼습니다.",
      },
    ];
    for (const t of defaults) {
      insert.run(randomUUID(), t.event, t.name, t.subject, t.body, now, now);
    }
  }

  // 정책 문서 기본값 시드
  const policiesCount = database
    .prepare(`SELECT count(*) AS c FROM policies`)
    .get() as { c: number };
  if (policiesCount.c === 0) {
    const now = new Date().toISOString();
    const insertPolicy = database.prepare(
      `INSERT INTO policies (id, policy_type, title, content, version, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 1, ?, ?)`,
    );
    insertPolicy.run(
      randomUUID(),
      "terms",
      "이용약관",
      "캐쉬움 이용약관 초안입니다. 관리자 페이지에서 내용을 수정해 주세요.",
      now,
      now,
    );
    insertPolicy.run(
      randomUUID(),
      "privacy",
      "개인정보처리방침",
      "캐쉬움 개인정보처리방침 초안입니다.",
      now,
      now,
    );
    insertPolicy.run(
      randomUUID(),
      "refund",
      "환불정책",
      "캐쉬움 환불정책 초안입니다.",
      now,
      now,
    );
    insertPolicy.run(
      randomUUID(),
      "content",
      "콘텐츠 이용 정책",
      "캐쉬움 콘텐츠 이용 정책 초안입니다.",
      now,
      now,
    );
    insertPolicy.run(
      randomUUID(),
      "marketing",
      "마케팅 수신 동의",
      "이벤트와 정보 안내를 위한 마케팅 수신 동의 문구입니다.",
      now,
      now,
    );
  }

  // 공지 테이블이 비어있으면 lib/data.ts의 기본 공지를 1회 시드합니다.
  const noticeCount = database.prepare(`SELECT count(*) AS c FROM notices`).get() as { c: number };
  if (noticeCount.c === 0) {
    const insertNotice = database.prepare(
      `INSERT INTO notices (id, title, content, is_published, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, 1, 0, ?, ?)`,
    );
    for (const notice of defaultNotices) {
      const isoDate = parseNoticeDate(notice.date);
      insertNotice.run(
        randomUUID(),
        notice.title,
        notice.content.join("\n\n"),
        isoDate,
        isoDate,
      );
    }
  }
}

// "2026.05.13" → ISO 문자열로 변환
function parseNoticeDate(input: string): string {
  const [year, month, day] = input.split(".");
  if (year && month && day) {
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
  }
  return new Date().toISOString();
}
