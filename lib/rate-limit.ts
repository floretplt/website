import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_DEFAULT = 20;
/** LiqPay result polling — separate bucket so checkout flow does not exhaust the default limit. */
const MAX_LIQPAY_CONFIRM = 40;

function createUpstashLimiter(max: number, prefix: string) {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const redis = new Redis({ url, token });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, "60 s"),
      prefix,
      analytics: false,
    });
  } catch (e) {
    console.error(`Upstash init failed (${prefix})`, e);
    return null;
  }
}

const upstashLimiterDefault = createUpstashLimiter(MAX_DEFAULT, "floret:rl");
const upstashLimiterLiqPayConfirm = createUpstashLimiter(
  MAX_LIQPAY_CONFIRM,
  "floret:rl:liqpay-confirm",
);

type MemoryBucket = { count: number; reset: number };

const memoryBuckets = new Map<string, MemoryBucket>();
let nextPruneAt = Date.now() + WINDOW_MS;

function memoryKey(ip: string, bucket: string): string {
  return `${bucket}:${ip}`;
}

function pruneExpired(now: number) {
  if (now < nextPruneAt) return;
  nextPruneAt = now + WINDOW_MS;
  for (const [key, entry] of memoryBuckets) {
    if (now > entry.reset) memoryBuckets.delete(key);
  }
}

function rateLimitInMemory(ip: string, max: number, bucket: string): boolean {
  const now = Date.now();
  pruneExpired(now);
  const key = memoryKey(ip, bucket);
  const entry = memoryBuckets.get(key);
  if (!entry || now > entry.reset) {
    memoryBuckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count += 1;
  return true;
}

async function rateLimitAsyncWithLimiter(
  ip: string,
  limiter: Ratelimit | null,
  max: number,
  bucket: string,
): Promise<boolean> {
  if (limiter) {
    try {
      const { success } = await limiter.limit(ip);
      return success;
    } catch (e) {
      console.error("Upstash rate-limit error, falling back to memory", e);
    }
  }
  return rateLimitInMemory(ip, max, bucket);
}

/**
 * Returns true when the request is allowed (default storefront bucket).
 */
export function rateLimit(ip: string): boolean {
  return rateLimitInMemory(ip, MAX_DEFAULT, "default");
}

/** Async variant — default bucket (orders, checkout init, inquiries). */
export async function rateLimitAsync(ip: string): Promise<boolean> {
  return rateLimitAsyncWithLimiter(
    ip,
    upstashLimiterDefault,
    MAX_DEFAULT,
    "default",
  );
}

/** Async variant — LiqPay confirm polling (higher limit). */
export async function rateLimitLiqPayConfirmAsync(ip: string): Promise<boolean> {
  return rateLimitAsyncWithLimiter(
    ip,
    upstashLimiterLiqPayConfirm,
    MAX_LIQPAY_CONFIRM,
    "liqpay-confirm",
  );
}

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
