import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databaseDir = path.join(process.cwd(), "data");
const databasePath = path.join(databaseDir, "cashoom.sqlite");

type GlobalWithDatabase = typeof globalThis & {
  __cashoomDatabase?: DatabaseSync;
};

export function getDatabase() {
  const globalForDatabase = globalThis as GlobalWithDatabase;

  if (!globalForDatabase.__cashoomDatabase) {
    mkdirSync(databaseDir, { recursive: true });

    const database = new DatabaseSync(databasePath);
    database.exec("PRAGMA foreign_keys = ON;");
    database.exec("PRAGMA journal_mode = WAL;");

    globalForDatabase.__cashoomDatabase = database;
  }

  initializeSchema(globalForDatabase.__cashoomDatabase);

  return globalForDatabase.__cashoomDatabase;
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
  `);
}
