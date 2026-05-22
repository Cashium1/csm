import { scryptSync, randomBytes, randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  password_salt: string;
  name: string;
  created_at: string;
};

type SessionUserRow = {
  id: string;
  email: string;
  name: string;
  created_at: string;
};

type AuthFieldErrors = {
  email?: string;
  name?: string;
  password?: string;
  passwordConfirm?: string;
};

export const sessionCookieName = "cashoom_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

const passwordKeyLength = 64;

export function initializeAuthDatabase() {
  getDatabase();
}

export function validateAuthFields(emailValue: unknown, passwordValue: unknown) {
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const errors: AuthFieldErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일을 입력해 주세요.";
  }

  if (password.length < 8) {
    errors.password = "비밀번호는 8자 이상이어야 합니다.";
  }

  return {
    email,
    password,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function validateSignupFields(
  emailValue: unknown,
  passwordValue: unknown,
  nameValue: unknown,
  passwordConfirmValue: unknown,
) {
  const authFields = validateAuthFields(emailValue, passwordValue);
  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const passwordConfirm = typeof passwordConfirmValue === "string" ? passwordConfirmValue : "";
  const errors: AuthFieldErrors = { ...authFields.errors };

  if (!name) {
    errors.name = "이름을 입력해 주세요.";
  } else if (name.length > 30) {
    errors.name = "이름은 30자 이하로 입력해 주세요.";
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = "비밀번호 확인을 입력해 주세요.";
  } else if (authFields.password !== passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }

  return {
    email: authFields.email,
    password: authFields.password,
    name,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

export function createUser(email: string, password: string, name: string) {
  const database = getDatabase();
  const existingUser = findUserByEmail(email);

  if (existingUser) {
    return { ok: false as const, message: "이미 가입된 이메일입니다." };
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const { passwordHash, passwordSalt } = hashPassword(password);

  database
    .prepare(`
      INSERT INTO "USER" (
        id,
        email,
        password_hash,
        password_salt,
        name,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(id, email, passwordHash, passwordSalt, name, now, now);

  return {
    ok: true as const,
    user: {
      id,
      email,
      name,
      createdAt: now,
    },
  };
}

// 이미 가입된 이메일인지 확인합니다.
export function isEmailTaken(email: string) {
  return Boolean(findUserByEmail(email.trim().toLowerCase()));
}

type ProfileUpdateErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export function updateUser(
  userId: string,
  values: { name?: unknown; email?: unknown; password?: unknown },
):
  | { ok: true; user: { id: string; name: string; email: string } }
  | { ok: false; errors: ProfileUpdateErrors } {
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const email = typeof values.email === "string" ? values.email.trim().toLowerCase() : "";
  const password = typeof values.password === "string" ? values.password : "";

  const errors: ProfileUpdateErrors = {};

  if (!name) {
    errors.name = "이름을 입력해 주세요.";
  } else if (name.length > 30) {
    errors.name = "이름은 30자 이하로 입력해 주세요.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일을 입력해 주세요.";
  }

  if (password && password.length < 8) {
    errors.password = "비밀번호는 8자 이상이어야 합니다.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const database = getDatabase();
  const duplicate = database
    .prepare(`SELECT id FROM "USER" WHERE email = ? AND id != ? LIMIT 1`)
    .get(email, userId) as { id: string } | undefined;

  if (duplicate) {
    return { ok: false, errors: { email: "이미 사용 중인 이메일입니다." } };
  }

  const now = new Date().toISOString();

  if (password) {
    const { passwordHash, passwordSalt } = hashPassword(password);
    database
      .prepare(`
        UPDATE "USER"
        SET name = ?, email = ?, password_hash = ?, password_salt = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(name, email, passwordHash, passwordSalt, now, userId);
  } else {
    database
      .prepare(`
        UPDATE "USER"
        SET name = ?, email = ?, updated_at = ?
        WHERE id = ?
      `)
      .run(name, email, now, userId);
  }

  return { ok: true, user: { id: userId, name, email } };
}

export function deleteUser(userId: string) {
  // user_sessions, course_purchases 등은 FK ON DELETE CASCADE로 함께 삭제됩니다.
  getDatabase().prepare(`DELETE FROM "USER" WHERE id = ?`).run(userId);
}

export function authenticateUser(email: string, password: string) {
  const user = findUserByEmail(email);

  if (!user || !verifyPassword(password, user.password_hash, user.password_salt)) {
    return null;
  }

  return toPublicUser(user);
}

// 특정 사용자의 비밀번호가 맞는지 확인합니다. (회원정보 수정 전 본인 확인용)
export function verifyUserPassword(userId: string, password: string) {
  if (typeof password !== "string" || password.length === 0) {
    return false;
  }

  const row = getDatabase()
    .prepare(`SELECT password_hash, password_salt FROM "USER" WHERE id = ? LIMIT 1`)
    .get(userId) as { password_hash: string; password_salt: string } | undefined;

  if (!row) {
    return false;
  }

  return verifyPassword(password, row.password_hash, row.password_salt);
}

export function createSession(userId: string) {
  const database = getDatabase();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionMaxAgeSeconds * 1000).toISOString();

  database
    .prepare(`
      INSERT INTO user_sessions (
        id,
        user_id,
        token_hash,
        expires_at,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(randomUUID(), userId, tokenHash, expiresAt, now.toISOString());

  return token;
}

export function getUserBySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const database = getDatabase();
  const now = new Date().toISOString();
  cleanupExpiredSessions(now);

  const row = database
    .prepare(`
      SELECT
        u.id,
        u.email,
        u.name,
        u.created_at
      FROM user_sessions s
      INNER JOIN "USER" u ON u.id = s.user_id
      WHERE s.token_hash = ?
        AND s.expires_at > ?
      LIMIT 1
    `)
    .get(hashSessionToken(token), now) as SessionUserRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  return getUserBySessionToken(token);
}

export function getCurrentUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;

  return getUserBySessionToken(token);
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    maxAge: sessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function deleteSessionByToken(token: string | undefined) {
  if (!token) {
    return;
  }

  getDatabase()
    .prepare("DELETE FROM user_sessions WHERE token_hash = ?")
    .run(hashSessionToken(token));
}

function findUserByEmail(email: string) {
  return getDatabase()
    .prepare(`
      SELECT
        id,
        email,
        password_hash,
        password_salt,
        name,
        created_at
      FROM "USER"
      WHERE email = ?
      LIMIT 1
    `)
    .get(email) as UserRow | undefined;
}

function hashPassword(password: string) {
  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = scryptSync(password, passwordSalt, passwordKeyLength).toString("hex");

  return { passwordHash, passwordSalt };
}

function verifyPassword(password: string, passwordHash: string, passwordSalt: string) {
  const expectedHash = Buffer.from(passwordHash, "hex");
  const actualHash = scryptSync(password, passwordSalt, passwordKeyLength);

  if (expectedHash.length !== actualHash.length) {
    return false;
  }

  return timingSafeEqual(expectedHash, actualHash);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cleanupExpiredSessions(now: string) {
  getDatabase().prepare("DELETE FROM user_sessions WHERE expires_at <= ?").run(now);
}

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at,
  };
}
