import { createHash } from 'node:crypto';

export class HttpError extends Error {
    constructor(status, message, { headers, code } = {}) {
        super(message);
        this.status = status;
        this.headers = headers;
        this.code = code;
        this.expose = true;
    }
}

export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
});

const MAX_BODY_BYTES = 4096;

export const readJson = async (request) => {
    const type = request.headers.get('content-type') || '';
    if (!type.toLowerCase().includes('application/json')) throw new HttpError(415, 'Send a JSON body.');
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Request body is too large.');
    try {
        const body = JSON.parse(text || '{}');
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object');
        return body;
    } catch {
        throw new HttpError(400, 'Request body is not valid JSON.');
    }
};

// Vercel sets x-real-ip / x-forwarded-for itself (client-supplied values are overwritten at the edge).
export const clientIp = (request) => {
    const real = request.headers.get('x-real-ip');
    if (real) return real.trim();
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return 'unknown';
};

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');

// IPs are only stored hashed (rate limits, leaderboard abuse tracing), with a secret salt so the
// small IPv4 space cannot be brute-forced from a data dump. IP_HASH_SALT is preferred; otherwise the
// salt is derived from DATABASE_URL, which is itself a secret. Never a public constant.
const ipSalt = () => {
    const salt = process.env.IP_HASH_SALT || (process.env.DATABASE_URL && sha256(`ip-salt:${process.env.DATABASE_URL}`));
    if (!salt) throw Object.assign(new Error('IP_HASH_SALT is not configured'), { status: 503, expose: true, publicMessage: 'The game server is not configured yet.' });
    return salt;
};
export const hashIp = (ip) => sha256(`${ipSalt()}:${ip}`);

export const playerToken = (request) => {
    const token = request.headers.get('x-player-token');
    return token && /^[A-Za-z0-9_-]{20,100}$/.test(token) ? token : null;
};

// Wraps a route: method dispatch, consistent JSON errors, no stack traces or secrets in responses.
export const route = (handlers) => async (request) => {
    const fn = handlers[request.method];
    if (!fn) {
        return json({ error: 'Method not allowed.' }, 405, { allow: Object.keys(handlers).join(', ') });
    }
    try {
        return await fn(request);
    } catch (err) {
        if (err?.expose) {
            return json({ error: err.publicMessage || err.message, ...(err.code ? { code: err.code } : {}) }, err.status || 500, err.headers || {});
        }
        console.error('[api] unexpected error', request.method, new URL(request.url).pathname, err?.code || '', err?.message || err);
        return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
};
