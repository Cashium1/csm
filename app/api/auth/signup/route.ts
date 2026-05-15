import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie, createSession, createUser, validateSignupFields } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await readJson(request);
  const { email, password, name, errors, isValid } = validateSignupFields(
    body.email,
    body.password,
    body.name,
    body.passwordConfirm,
  );

  if (!isValid) {
    return NextResponse.json({ message: "입력값을 확인해 주세요.", errors }, { status: 400 });
  }

  const result = createUser(email, password, name);

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 409 });
  }

  const token = createSession(result.user.id);
  const response = NextResponse.json({ user: result.user }, { status: 201 });
  attachSessionCookie(response, token);

  return response;
}

async function readJson(request: NextRequest) {
  try {
    return (await request.json()) as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
      passwordConfirm?: unknown;
    };
  } catch {
    return {};
  }
}
