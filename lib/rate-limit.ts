const hits = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX = 20;

let nextPruneAt = Date.now() + WINDOW_MS;

function pruneExpired(now: number) {
  if (now < nextPruneAt) return;
  nextPruneAt = now + WINDOW_MS;
  for (const [ip, entry] of hits) {
    if (now > entry.reset) hits.delete(ip);
  }
}

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  pruneExpired(now);
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX) {
    return false;
  }
  entry.count += 1;
  return true;
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
