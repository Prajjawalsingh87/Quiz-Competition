import { useEffect, useState } from 'react';
import { apiFetch } from './api';

const REFRESH_MS = 20000;

// Live global leaderboard: fetches on mount / filter change and refreshes while the tab is visible.
const useLeaderboard = ({ topicId = 'all', difficulty = 'all' } = {}) => {
    const [data, setData] = useState({ key: null, entries: [], error: null });
    const [retry, setRetry] = useState(0);
    const key = `${topicId}|${difficulty}`;

    useEffect(() => {
        let cancelled = false;
        let timer;
        const controller = new AbortController();
        const load = async () => {
            try {
                const params = new URLSearchParams({ topic: topicId, difficulty });
                const res = await apiFetch(`/api/leaderboard?${params}`, { signal: controller.signal });
                if (!cancelled) setData({ key, entries: res.entries, error: null });
            } catch (err) {
                if (!cancelled && !controller.signal.aborted) setData((prev) => ({ key, entries: prev.key === key ? prev.entries : [], error: err }));
            }
            if (!cancelled) timer = setTimeout(load, REFRESH_MS);
        };
        load();
        return () => {
            cancelled = true;
            controller.abort();
            clearTimeout(timer);
        };
    }, [key, topicId, difficulty, retry]);

    return {
        entries: data.key === key ? data.entries : [],
        loading: data.key !== key,
        error: data.key === key ? data.error : null,
        retry: () => setRetry((n) => n + 1),
    };
};

export default useLeaderboard;
