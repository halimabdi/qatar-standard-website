// Simple in-memory rate limiter — no external dependencies
const hits = new Map<string, number[]>();

// Clean old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of hits) {
    const fresh = times.filter(t => now - t < 120_000);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}, 300_000);

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const times = hits.get(key) || [];
  const recent = times.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
