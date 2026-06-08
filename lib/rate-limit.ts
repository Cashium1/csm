import type { NextRequest } from "next/server";

// 간단한 고정 윈도우(fixed window) 인메모리 레이트리미터입니다.
//
// 주의: 프로세스 메모리에만 저장하므로 다중 인스턴스 환경에서는 인스턴스별로 카운트가
// 분리됩니다. 현재 단일 인스턴스(SQLite 파일 DB) 구조에는 충분하지만, 수평 확장 시에는
// Redis(예: Upstash) 등 공유 저장소 기반으로 교체해야 합니다.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// 메모리 누수 방지를 위해 만료된 버킷을 가끔 정리합니다.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * key 기준으로 windowMs 동안 limit회까지 허용합니다.
 * 허용되면 ok=true, 초과되면 ok=false와 retryAfterSeconds를 반환합니다.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return { ok: true, remaining: options.limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: options.limit - bucket.count, retryAfterSeconds: 0 };
}

/** 요청에서 클라이언트 IP를 추출합니다. (프록시 X-Forwarded-For 우선) */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
