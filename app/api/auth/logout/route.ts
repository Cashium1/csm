import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, deleteSessionByToken, sessionCookieName } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  deleteSessionByToken(token);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
