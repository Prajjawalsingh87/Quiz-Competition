// Small client for the serverless API in /api.
export class ApiError extends Error {
    constructor(message, status, code) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

export const apiFetch = async (path, { method = 'GET', body, token, signal, timeoutMs = 10000 } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    signal?.addEventListener('abort', onAbort);
    try {
        const res = await fetch(path, {
            method,
            signal: controller.signal,
            headers: {
                ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
                ...(token ? { 'x-player-token': token } : {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            throw new ApiError(data?.error || `Request failed (${res.status}).`, res.status, data?.code);
        }
        return data;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if (signal?.aborted) throw err;
        throw new ApiError(navigator.onLine === false ? 'You are offline. Reconnect and try again.' : 'Could not reach the game server. Try again.', 0, 'network');
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
    }
};
