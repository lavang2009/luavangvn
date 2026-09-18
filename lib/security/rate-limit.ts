type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

const WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000);
const MAX = Number(process.env.RATE_LIMIT_MAX ?? 20);

export function rateLimit(key: string, max = MAX, windowMs = WINDOW) {
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  current.count += 1;
  store.set(key, current);
  return { ok: current.count <= max, remaining: Math.max(0, max - current.count), retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
}
