import { HttpError, clientIp, hashIp } from './http.js';

// Fixed-window counters kept in Postgres: serverless instances share no memory, so an
// in-process counter would reset on every cold start and differ between instances.
export const LIMITS = {
    createRoom: { limit: 10, windowMs: 60 * 60 * 1000 },
    joinRoom: { limit: 30, windowMs: 10 * 60 * 1000 },
    submitScore: { limit: 5, windowMs: 60 * 1000 },
    submitScoreDaily: { limit: 60, windowMs: 24 * 60 * 60 * 1000 },
};

// Atomically counts this hit and returns { allowed, retryAfterMs }.
export const hit = async (sql, key, { limit, windowMs }, now = Date.now()) => {
    const [row] = await sql`
        INSERT INTO rate_limits (key, window_start, count)
        VALUES (${key}, ${now}::bigint, 1)
        ON CONFLICT (key) DO UPDATE SET
            count = CASE WHEN rate_limits.window_start <= ${now - windowMs}::bigint THEN 1 ELSE rate_limits.count + 1 END,
            window_start = CASE WHEN rate_limits.window_start <= ${now - windowMs}::bigint THEN ${now}::bigint ELSE rate_limits.window_start END
        RETURNING count, window_start`;
    const count = Number(row.count);
    const retryAfterMs = Math.max(0, Number(row.window_start) + windowMs - now);
    return { allowed: count <= limit, count, retryAfterMs };
};

export const enforce = async (sql, request, name, now = Date.now()) => {
    const rule = LIMITS[name];
    const ipHash = hashIp(clientIp(request));
    const result = await hit(sql, `${name}:${ipHash}`, rule, now);
    if (!result.allowed) {
        const seconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000));
        throw new HttpError(429, `Too many requests. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`, {
            headers: { 'retry-after': String(seconds) },
            code: 'rate_limited',
        });
    }
    return ipHash;
};

// Old windows are useless once expired; prune them now and then (called from write paths).
export const pruneRateLimits = (sql, now = Date.now()) => sql`
    DELETE FROM rate_limits WHERE window_start < ${now - 2 * 24 * 60 * 60 * 1000}::bigint`;
