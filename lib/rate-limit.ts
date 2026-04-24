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

// Vercel / most reverse-proxies set x-forwarded-for reliably.
// We take only the *last* (rightmost) address added by a trusted proxy, not the
// first (which a client can forge by sending their own x-forwarded-for header).
// For Vercel this is safe because their edge always appends the real client IP.
export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    // Last entry is the one appended by the outermost trusted proxy.
    const last = parts[parts.length - 1];
    if (last) return last;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
