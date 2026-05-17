import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX = 20;

/**
 * Upstash Redis rate-limit when UPSTASH_REDIS_REST_URL/TOKEN are set
 * (production on Vercel — multi-instance safe). Falls back to per-instance
 * in-memory bucket otherwise (local dev, preview deployments).
 */
const upstashLimiter = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX, "60 s"),
      prefix: "floret:rl",
      analytics: false,
    });
  } catch (e) {
    console.error("Upstash init failed, falling back to in-memory", e);
    return null;
  }
})();

const memoryHits = new Map<string, { count: number; reset: number }>();
let nextPruneAt = Date.now() + WINDOW_MS;

function pruneExpired(now: number) {
  if (now < nextPruneAt) return;
  nextPruneAt = now + WINDOW_MS;
  for (const [ip, entry] of memoryHits) {
    if (now > entry.reset) memoryHits.delete(ip);
  }
}

function rateLimitInMemory(ip: string): boolean {
  const now = Date.now();
  pruneExpired(now);
  const entry = memoryHits.get(ip);
  if (!entry || now > entry.reset) {
    memoryHits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX) return false;
  entry.count += 1;
  return true;
}

/**
 * Returns true when the request is allowed.
 * Sync overload (in-memory only) is kept for callers that don't want to await.
 */
export function rateLimit(ip: string): boolean {
  return rateLimitInMemory(ip);
}

/** Async variant — uses Upstash when configured, else falls back to memory. */
export async function rateLimitAsync(ip: string): Promise<boolean> {
  if (upstashLimiter) {
    try {
      const { success } = await upstashLimiter.limit(ip);
      return success;
    } catch (e) {
      console.error("Upstash rate-limit error, falling back to memory", e);
    }
  }
  return rateLimitInMemory(ip);
}

// Vercel rewrites x-forwarded-for so the *first* entry is the real client IP
// (the edge node strips any spoofed values and prepends the verified address).
// Vercel additionally exposes `x-real-ip` (single client IP) and
// `x-vercel-forwarded-for` (mirror of XFF). We prefer x-real-ip and fall back
// to the first entry of XFF — never the last, which would be the edge proxy
// itself and would cause every request to share one bucket.
export function getClientIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const xff =
    headers.get("x-forwarded-for") ?? headers.get("x-vercel-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}
